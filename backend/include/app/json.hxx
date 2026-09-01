#pragma once

#include <json/json.h>

#include <string>

#include "httplib.h"

namespace app
{
bool read_json(const httplib::Request &request, Json::Value &value, std::string &error);
void send_json(httplib::Response &response, int status, const Json::Value &value);
void send_error(httplib::Response &response, int status, const std::string &message);
void send_success(httplib::Response &response, int status, const std::string &message);
void set_cors_headers(httplib::Response &response);
} // namespace app
