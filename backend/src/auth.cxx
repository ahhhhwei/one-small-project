#include "app/auth.hxx"

#include <array>
#include <cctype>
#include <chrono>
#include <iomanip>
#include <memory>
#include <sstream>
#include <stdexcept>
#include <vector>

#include <openssl/crypto.h>
#include <openssl/evp.h>
#include <openssl/hmac.h>
#include <openssl/rand.h>

#include <odb/transaction.hxx>

#include "app/models.hxx"
#include "models-odb.hxx"

namespace app
{
namespace
{
constexpr int password_iterations = 120000;
constexpr std::size_t signature_size = 32;

std::string bytes_to_hex(const unsigned char *bytes, std::size_t size)
{
    std::ostringstream output;
    output << std::hex << std::setfill('0');
    for (std::size_t i = 0; i < size; ++i)
    {
        output << std::setw(2) << static_cast<unsigned int>(bytes[i]);
    }
    return output.str();
}

std::string base64url_encode(const unsigned char *bytes, std::size_t size)
{
    if (size == 0)
    {
        return "";
    }
    std::string result(4 * ((size + 2) / 3), '\0');
    const int length = EVP_EncodeBlock(reinterpret_cast<unsigned char *>(result.data()),
                                       bytes,
                                       static_cast<int>(size));
    if (length < 0)
    {
        throw std::runtime_error("令牌编码失败");
    }
    result.resize(static_cast<std::size_t>(length));
    for (char &character : result)
    {
        if (character == '+') character = '-';
        else if (character == '/') character = '_';
    }
    while (!result.empty() && result.back() == '=') result.pop_back();
    return result;
}

std::optional<std::vector<unsigned char>> base64url_decode(std::string value)
{
    if (value.empty() || value.size() % 4 == 1)
    {
        return std::nullopt;
    }
    for (char &character : value)
    {
        if (character == '-') character = '+';
        else if (character == '_') character = '/';
        else if (!std::isalnum(static_cast<unsigned char>(character)))
            return std::nullopt;
    }
    const std::size_t unpadded_size = value.size();
    while (value.size() % 4 != 0) value.push_back('=');
    std::vector<unsigned char> result(3 * (value.size() / 4));
    const int decoded = EVP_DecodeBlock(result.data(),
                                        reinterpret_cast<const unsigned char *>(value.data()),
                                        static_cast<int>(value.size()));
    if (decoded < 0)
    {
        return std::nullopt;
    }
    const std::size_t padding = value.size() - unpadded_size;
    if (static_cast<std::size_t>(decoded) < padding)
    {
        return std::nullopt;
    }
    result.resize(static_cast<std::size_t>(decoded) - padding);
    return result;
}

std::array<unsigned char, signature_size> sign(const std::string &content,
                                                const std::string &secret)
{
    std::array<unsigned char, signature_size> signature{};
    unsigned int length = 0;
    if (HMAC(EVP_sha256(),
             secret.data(),
             static_cast<int>(secret.size()),
             reinterpret_cast<const unsigned char *>(content.data()),
             content.size(),
             signature.data(),
             &length) == nullptr ||
        length != signature.size())
    {
        throw std::runtime_error("令牌签名失败");
    }
    return signature;
}

Json::Value auth_fields(const std::string &username,
                        const std::string &remote_address = "")
{
    Json::Value fields(Json::objectValue);
    fields["username"] = username;
    if (!remote_address.empty()) fields["remoteAddress"] = remote_address;
    return fields;
}
} // namespace

AuthService::AuthService(odb::mysql::database &database,
                         std::string token_secret,
                         std::uint32_t token_lifetime_hours,
                         Logger &logger)
    : database_(database),
      token_secret_(std::move(token_secret)),
      token_lifetime_hours_(token_lifetime_hours),
      logger_(logger)
{
}

std::string AuthService::random_hex(std::size_t byte_count) const
{
    std::vector<unsigned char> bytes(byte_count);
    if (RAND_bytes(bytes.data(), static_cast<int>(bytes.size())) != 1)
    {
        throw std::runtime_error("安全随机数生成失败");
    }
    return bytes_to_hex(bytes.data(), bytes.size());
}

std::string AuthService::hash_password(const std::string &password, const std::string &salt) const
{
    std::array<unsigned char, 32> derived{};
    if (PKCS5_PBKDF2_HMAC(password.c_str(),
                          static_cast<int>(password.size()),
                          reinterpret_cast<const unsigned char *>(salt.data()),
                          static_cast<int>(salt.size()),
                          password_iterations,
                          EVP_sha256(),
                          static_cast<int>(derived.size()),
                          derived.data()) != 1)
    {
        throw std::runtime_error("密码哈希计算失败");
    }
    return bytes_to_hex(derived.data(), derived.size());
}

void AuthService::seed_user(const std::string &username,
                            const std::string &password,
                            const std::string &role,
                            const std::string &display_name,
                            int student_id,
                            const std::string &teacher_name)
{
    User existing;
    if (database_.find<User>(username, existing))
    {
        return;
    }

    const std::string salt = random_hex(16);
    User user(username,
              hash_password(password, salt),
              salt,
              role,
              display_name,
              student_id,
              teacher_name);
    database_.persist(user);
}

void AuthService::initialize_users()
{
    odb::transaction transaction(database_.begin());
    seed_user("admin", "Admin@123", "admin", "系统管理员", 0, "-");
    seed_user("teacher01", "Teacher@123", "teacher", "蒋莉老师", 0, "蒋莉");
    seed_user("student01", "Student@123", "student", "演示学生", 20000001, "-");
    transaction.commit();
}

std::optional<LoginResult> AuthService::login(const std::string &username,
                                               const std::string &password)
{
    User user;
    {
        odb::transaction transaction(database_.begin());
        if (!database_.find<User>(username, user))
        {
            logger_.warning("auth.login_failed", "登录凭据校验失败", auth_fields(username));
            return std::nullopt;
        }
        transaction.commit();
    }

    const std::string actual_hash = hash_password(password, user.password_salt);
    if (actual_hash.size() != user.password_hash.size() ||
        CRYPTO_memcmp(actual_hash.data(), user.password_hash.data(), actual_hash.size()) != 0)
    {
        logger_.warning("auth.login_failed", "登录凭据校验失败", auth_fields(username));
        return std::nullopt;
    }

    LoginResult result;
    result.user = Principal{user.username,
                            user.role,
                            user.display_name,
                            user.student_id,
                            user.teacher_name};
    result.token = create_token(result.user);
    Json::Value fields = auth_fields(username);
    fields["role"] = user.role;
    logger_.info("auth.login_succeeded", "用户登录成功", fields);
    return result;
}

std::string AuthService::create_token(const Principal &principal) const
{
    const auto now = std::chrono::system_clock::now();
    const auto issued_at = std::chrono::duration_cast<std::chrono::seconds>(
                               now.time_since_epoch())
                               .count();
    const auto expires_at = issued_at + static_cast<long long>(token_lifetime_hours_) * 3600;

    Json::Value payload(Json::objectValue);
    payload["sub"] = principal.username;
    payload["role"] = principal.role;
    payload["name"] = principal.display_name;
    payload["studentId"] = principal.student_id;
    payload["teacherName"] = principal.teacher_name;
    payload["iat"] = Json::Int64(issued_at);
    payload["exp"] = Json::Int64(expires_at);
    payload["nonce"] = random_hex(8);

    Json::StreamWriterBuilder builder;
    builder["indentation"] = "";
    const std::string json = Json::writeString(builder, payload);
    const std::string encoded_payload = base64url_encode(
        reinterpret_cast<const unsigned char *>(json.data()), json.size());
    const std::string signed_content = "v1." + encoded_payload;
    const auto signature = sign(signed_content, token_secret_);
    return signed_content + "." + base64url_encode(signature.data(), signature.size());
}

std::optional<Principal> AuthService::verify_token(const std::string &token,
                                                   std::string &reason) const
{
    if (token.size() > 4096)
    {
        reason = "token_too_large";
        return std::nullopt;
    }
    const std::size_t first = token.find('.');
    const std::size_t second = first == std::string::npos ? first : token.find('.', first + 1);
    if (first != 2 || token.substr(0, first) != "v1" || second == std::string::npos ||
        token.find('.', second + 1) != std::string::npos)
    {
        reason = "invalid_format";
        return std::nullopt;
    }

    const std::string signed_content = token.substr(0, second);
    const auto actual_signature = base64url_decode(token.substr(second + 1));
    const auto expected_signature = sign(signed_content, token_secret_);
    if (!actual_signature || actual_signature->size() != expected_signature.size() ||
        CRYPTO_memcmp(actual_signature->data(),
                      expected_signature.data(),
                      expected_signature.size()) != 0)
    {
        reason = "invalid_signature";
        return std::nullopt;
    }

    const auto decoded_payload = base64url_decode(token.substr(first + 1, second - first - 1));
    if (!decoded_payload)
    {
        reason = "invalid_payload";
        return std::nullopt;
    }
    const std::string json(decoded_payload->begin(), decoded_payload->end());
    Json::Value payload;
    Json::CharReaderBuilder builder;
    builder["collectComments"] = false;
    std::string parse_error;
    std::unique_ptr<Json::CharReader> reader(builder.newCharReader());
    if (!reader->parse(json.data(), json.data() + json.size(), &payload, &parse_error) ||
        !payload.isObject() || !payload["sub"].isString() ||
        !payload["role"].isString() || !payload["name"].isString() ||
        !payload["studentId"].isInt() || !payload["teacherName"].isString() ||
        !payload["iat"].isInt64() || !payload["exp"].isInt64())
    {
        reason = "invalid_payload";
        return std::nullopt;
    }

    const std::string role = payload["role"].asString();
    if (role != "admin" && role != "teacher" && role != "student")
    {
        reason = "invalid_role";
        return std::nullopt;
    }
    const auto now = std::chrono::duration_cast<std::chrono::seconds>(
                         std::chrono::system_clock::now().time_since_epoch())
                         .count();
    const Json::Int64 issued_at = payload["iat"].asInt64();
    const Json::Int64 expires_at = payload["exp"].asInt64();
    const Json::Int64 maximum_lifetime = static_cast<Json::Int64>(token_lifetime_hours_) * 3600;
    if (expires_at <= now)
    {
        reason = "expired";
        return std::nullopt;
    }
    if (issued_at > now + 60 || expires_at <= issued_at || expires_at - issued_at > maximum_lifetime)
    {
        reason = "invalid_lifetime";
        return std::nullopt;
    }

    return Principal{payload["sub"].asString(),
                     role,
                     payload["name"].asString(),
                     payload["studentId"].asInt(),
                     payload["teacherName"].asString()};
}

std::optional<std::string> AuthService::bearer_token(const httplib::Request &request) const
{
    const std::string authorization = request.get_header_value("Authorization");
    constexpr const char *prefix = "Bearer ";
    if (authorization.compare(0, 7, prefix) != 0 || authorization.size() <= 7)
    {
        return std::nullopt;
    }
    return authorization.substr(7);
}

std::optional<Principal> AuthService::authenticate(const httplib::Request &request)
{
    const auto token = bearer_token(request);
    if (!token)
    {
        Json::Value fields(Json::objectValue);
        fields["path"] = request.path;
        fields["remoteAddress"] = request.remote_addr;
        fields["reason"] = "missing_bearer_token";
        logger_.warning("auth.request_rejected", "请求缺少有效登录凭据", fields);
        return std::nullopt;
    }
    std::string reason;
    const auto principal = verify_token(*token, reason);
    if (!principal)
    {
        Json::Value fields(Json::objectValue);
        fields["path"] = request.path;
        fields["remoteAddress"] = request.remote_addr;
        fields["reason"] = reason;
        logger_.warning("auth.request_rejected", "请求登录凭据无效", fields);
    }
    return principal;
}

void AuthService::logout(const httplib::Request &request)
{
    const auto token = bearer_token(request);
    if (!token)
    {
        return;
    }
    std::string reason;
    const auto principal = verify_token(*token, reason);
    if (principal)
    {
        logger_.info("auth.logout", "用户退出登录", auth_fields(principal->username, request.remote_addr));
    }
}
} // namespace app
