#pragma once

#include <fstream>
#include <mutex>
#include <string>

#include <json/json.h>

namespace app
{
class Logger
{
public:
    explicit Logger(std::string directory);

    void info(const std::string &event,
              const std::string &message,
              const Json::Value &fields = Json::Value(Json::objectValue));
    void warning(const std::string &event,
                 const std::string &message,
                 const Json::Value &fields = Json::Value(Json::objectValue));
    void error(const std::string &event,
               const std::string &message,
               const Json::Value &fields = Json::Value(Json::objectValue));

private:
    void write(const char *level,
               const std::string &event,
               const std::string &message,
               const Json::Value &fields);
    void open_for_date(const std::string &date);

    std::string directory_;
    std::string opened_date_;
    std::ofstream stream_;
    std::mutex mutex_;
};
} // namespace app
