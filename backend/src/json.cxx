#include "app/json.hxx"

#include <memory>
#include <sstream>

namespace app
{
bool read_json(const httplib::Request &request, Json::Value &value, std::string &error)
{
    Json::CharReaderBuilder builder;
    builder["collectComments"] = false;
    std::unique_ptr<Json::CharReader> reader(builder.newCharReader());
    return reader->parse(
        request.body.data(), request.body.data() + request.body.size(), &value, &error);
}

void set_cors_headers(httplib::Response &response)
{
    response.set_header("Access-Control-Allow-Origin", "*");
    response.set_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    response.set_header("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

void send_json(httplib::Response &response, int status, const Json::Value &value)
{
    Json::StreamWriterBuilder builder;
    builder["indentation"] = "";
    response.status = status;
    response.set_content(Json::writeString(builder, value), "application/json; charset=utf-8");
    set_cors_headers(response);
}

void send_error(httplib::Response &response, int status, const std::string &message)
{
    Json::Value value;
    value["success"] = false;
    value["error"] = message;
    send_json(response, status, value);
}

void send_success(httplib::Response &response, int status, const std::string &message)
{
    Json::Value value;
    value["success"] = true;
    value["message"] = message;
    send_json(response, status, value);
}
} // namespace app
