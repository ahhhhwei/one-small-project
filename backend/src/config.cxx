#include "app/config.hxx"

#include <cstdlib>
#include <limits>
#include <stdexcept>

namespace app
{
namespace
{
std::string environment(const char *name, const char *fallback)
{
    const char *value = std::getenv(name);
    return value == nullptr || *value == '\0' ? fallback : value;
}

std::uint16_t port(const char *name, const char *fallback)
{
    const std::string value = environment(name, fallback);
    char *end = nullptr;
    const unsigned long parsed = std::strtoul(value.c_str(), &end, 10);
    if (end == nullptr || *end != '\0' || parsed == 0 ||
        parsed > std::numeric_limits<std::uint16_t>::max())
    {
        throw std::runtime_error(std::string("无效端口环境变量：") + name);
    }
    return static_cast<std::uint16_t>(parsed);
}

std::uint32_t positive_integer(const char *name, const char *fallback, std::uint32_t maximum)
{
    const std::string value = environment(name, fallback);
    char *end = nullptr;
    const unsigned long parsed = std::strtoul(value.c_str(), &end, 10);
    if (end == nullptr || *end != '\0' || parsed == 0 || parsed > maximum)
    {
        throw std::runtime_error(std::string("无效正整数环境变量：") + name);
    }
    return static_cast<std::uint32_t>(parsed);
}
} // namespace

Config load_config()
{
    Config config{
        environment("DB_HOST", "127.0.0.1"),
        port("DB_PORT", "3307"),
        environment("DB_NAME", "wenjw_db"),
        environment("DB_USER", "root"),
        environment("DB_PASSWORD", "123456"),
        environment("APP_HOST", "0.0.0.0"),
        port("APP_PORT", "8080"),
        environment("AUTH_SECRET", "course-selection-development-secret-change-before-deploy"),
        positive_integer("AUTH_TOKEN_HOURS", "8", 168),
        environment("LOG_DIR", "logs")};
    if (config.auth_secret.size() < 32)
    {
        throw std::runtime_error("AUTH_SECRET 至少需要 32 个字符");
    }
    return config;
}
} // namespace app
