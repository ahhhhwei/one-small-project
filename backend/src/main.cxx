#include <iostream>
#include <odb/mysql/database.hxx>

#include "app/api.hxx"
#include "app/auth.hxx"
#include "app/config.hxx"
#include "app/logger.hxx"
#include "app/repository.hxx"
#include "httplib.h"

int main()
{
    try
    {
        const app::Config config = app::load_config();
        app::Logger logger(config.log_directory);
        odb::mysql::database database(config.db_user,
                                      config.db_password,
                                      config.db_name,
                                      config.db_host,
                                      config.db_port,
                                      nullptr,
                                      "utf8mb4");

        app::AuthService auth(database,
                              config.auth_secret,
                              config.auth_token_hours,
                              logger);
        auth.initialize_users();
        app::Repository repository(database);
        app::Api api(repository, auth, logger);

        httplib::Server server;
        server.set_socket_options([](socket_t socket) {
            int enabled = 1;
#ifdef _WIN32
            setsockopt(socket,
                       SOL_SOCKET,
                       SO_REUSEADDR,
                       reinterpret_cast<const char *>(&enabled),
                       sizeof(enabled));
#else
            setsockopt(socket,
                       SOL_SOCKET,
                       SO_REUSEADDR,
                       reinterpret_cast<const void *>(&enabled),
                       sizeof(enabled));
#endif
        });
        api.register_routes(server);

        Json::Value startup(Json::objectValue);
        startup["listenAddress"] = config.listen_host + ':' + std::to_string(config.listen_port);
        startup["databaseAddress"] = config.db_host + ':' + std::to_string(config.db_port);
        startup["databaseName"] = config.db_name;
        startup["logDirectory"] = config.log_directory;
        startup["tokenLifetimeHours"] = config.auth_token_hours;
        logger.info("server.starting", "学生选课系统后端正在启动", startup);
        if (config.auth_secret == "course-selection-development-secret-change-before-deploy")
        {
            logger.warning("config.development_secret",
                           "当前使用开发环境 AUTH_SECRET，部署前必须更换");
        }
        if (!server.listen(config.listen_host, config.listen_port))
        {
            Json::Value fields(Json::objectValue);
            fields["listenAddress"] = config.listen_host + ':' + std::to_string(config.listen_port);
            logger.error("server.listen_failed", "端口监听失败，可能已有后端进程运行", fields);
            return 1;
        }
    }
    catch (const std::exception &exception)
    {
        std::cerr << "启动失败：" << exception.what() << std::endl;
        return 1;
    }
    return 0;
}
