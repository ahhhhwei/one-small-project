#pragma once

#include <cstdint>
#include <optional>
#include <string>

#include <odb/mysql/database.hxx>

#include "httplib.h"
#include "app/logger.hxx"

namespace app
{
struct Principal
{
    std::string username;
    std::string role;
    std::string display_name;
    int student_id = 0;
    std::string teacher_name;
};

struct LoginResult
{
    std::string token;
    Principal user;
};

class AuthService
{
public:
    AuthService(odb::mysql::database &database,
                std::string token_secret,
                std::uint32_t token_lifetime_hours,
                Logger &logger);

    void initialize_users();
    std::optional<LoginResult> login(const std::string &username, const std::string &password);
    std::optional<Principal> authenticate(const httplib::Request &request);
    void logout(const httplib::Request &request);

private:
    std::string hash_password(const std::string &password, const std::string &salt) const;
    std::string random_hex(std::size_t byte_count) const;
    std::string create_token(const Principal &principal) const;
    std::optional<Principal> verify_token(const std::string &token, std::string &reason) const;
    std::optional<std::string> bearer_token(const httplib::Request &request) const;
    void seed_user(const std::string &username,
                   const std::string &password,
                   const std::string &role,
                   const std::string &display_name,
                   int student_id,
                   const std::string &teacher_name);

    odb::mysql::database &database_;
    std::string token_secret_;
    std::uint32_t token_lifetime_hours_;
    Logger &logger_;
};
} // namespace app
