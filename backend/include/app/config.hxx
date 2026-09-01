#pragma once

#include <cstdint>
#include <string>

namespace app
{
struct Config
{
    std::string db_host;
    std::uint16_t db_port;
    std::string db_name;
    std::string db_user;
    std::string db_password;
    std::string listen_host;
    std::uint16_t listen_port;
    std::string auth_secret;
    std::uint32_t auth_token_hours;
    std::string log_directory;
};

Config load_config();
} // namespace app
