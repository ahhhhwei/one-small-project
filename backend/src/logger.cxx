#include "app/logger.hxx"

#include <chrono>
#include <cstdio>
#include <ctime>
#include <filesystem>
#include <iostream>
#include <stdexcept>
#include <utility>

#ifdef _WIN32
#include <process.h>
#else
#include <unistd.h>
#endif

namespace app
{
namespace
{
std::tm utc_time(std::time_t value)
{
    std::tm result{};
#ifdef _WIN32
    gmtime_s(&result, &value);
#else
    gmtime_r(&value, &result);
#endif
    return result;
}

std::string date_string(const std::chrono::system_clock::time_point &now)
{
    const std::time_t value = std::chrono::system_clock::to_time_t(now);
    const std::tm utc = utc_time(value);
    char buffer[11]{};
    std::strftime(buffer, sizeof(buffer), "%Y-%m-%d", &utc);
    return buffer;
}

std::string timestamp(const std::chrono::system_clock::time_point &now)
{
    const std::time_t value = std::chrono::system_clock::to_time_t(now);
    const std::tm utc = utc_time(value);
    const auto milliseconds = std::chrono::duration_cast<std::chrono::milliseconds>(
                                  now.time_since_epoch()) %
                              1000;
    char buffer[96]{};
    std::snprintf(buffer,
                  sizeof(buffer),
                  "%04d-%02d-%02dT%02d:%02d:%02d.%03lldZ",
                  utc.tm_year + 1900,
                  utc.tm_mon + 1,
                  utc.tm_mday,
                  utc.tm_hour,
                  utc.tm_min,
                  utc.tm_sec,
                  static_cast<long long>(milliseconds.count()));
    return buffer;
}

int process_id()
{
#ifdef _WIN32
    return _getpid();
#else
    return static_cast<int>(getpid());
#endif
}
} // namespace

Logger::Logger(std::string directory) : directory_(std::move(directory))
{
    if (directory_.empty())
    {
        throw std::runtime_error("日志目录不能为空");
    }
    std::filesystem::create_directories(directory_);
    open_for_date(date_string(std::chrono::system_clock::now()));
}

void Logger::open_for_date(const std::string &date)
{
    if (stream_.is_open())
    {
        stream_.close();
    }
    const std::filesystem::path path =
        std::filesystem::path(directory_) / ("backend-" + date + ".jsonl");
    stream_.open(path, std::ios::out | std::ios::app);
    if (!stream_)
    {
        throw std::runtime_error("无法打开日志文件：" + path.string());
    }
    opened_date_ = date;
}

void Logger::write(const char *level,
                   const std::string &event,
                   const std::string &message,
                   const Json::Value &fields)
{
    const auto now = std::chrono::system_clock::now();
    const std::string date = date_string(now);

    Json::Value record(Json::objectValue);
    record["timestamp"] = timestamp(now);
    record["level"] = level;
    record["event"] = event;
    record["message"] = message;
    record["processId"] = process_id();
    if (fields.isObject() && !fields.empty())
    {
        record["fields"] = fields;
    }

    Json::StreamWriterBuilder builder;
    builder["indentation"] = "";
    builder["emitUTF8"] = true;
    const std::string line = Json::writeString(builder, record);

    std::lock_guard<std::mutex> lock(mutex_);
    if (date != opened_date_)
    {
        open_for_date(date);
    }
    stream_ << line << '\n';
    stream_.flush();
    std::clog << line << std::endl;
}

void Logger::info(const std::string &event,
                  const std::string &message,
                  const Json::Value &fields)
{
    write("INFO", event, message, fields);
}

void Logger::warning(const std::string &event,
                     const std::string &message,
                     const Json::Value &fields)
{
    write("WARN", event, message, fields);
}

void Logger::error(const std::string &event,
                   const std::string &message,
                   const Json::Value &fields)
{
    write("ERROR", event, message, fields);
}

} // namespace app
