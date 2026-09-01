cmake_minimum_required(VERSION 3.16)
project(course_selection_server LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

find_package(PkgConfig REQUIRED)
find_package(OpenSSL REQUIRED)
find_package(Threads REQUIRED)
find_program(ODB_COMPILER odb REQUIRED)

pkg_check_modules(ODB REQUIRED IMPORTED_TARGET libodb)
pkg_check_modules(ODB_MYSQL REQUIRED IMPORTED_TARGET libodb-mysql)
pkg_check_modules(JSONCPP REQUIRED IMPORTED_TARGET jsoncpp)

set(MODEL_HEADER ${CMAKE_CURRENT_SOURCE_DIR}/include/app/models.hxx)
set(GENERATED_DIR ${CMAKE_CURRENT_BINARY_DIR}/generated)
set(GENERATED_SOURCE ${GENERATED_DIR}/models-odb.cxx)
set(GENERATED_HEADER ${GENERATED_DIR}/models-odb.hxx)
set(GENERATED_INLINE ${GENERATED_DIR}/models-odb.ixx)

add_custom_command(
    OUTPUT ${GENERATED_SOURCE} ${GENERATED_HEADER} ${GENERATED_INLINE}
    COMMAND ${CMAKE_COMMAND} -E make_directory ${GENERATED_DIR}
    COMMAND ${ODB_COMPILER}
            --database mysql
            --std c++17
            --generate-query
            --output-dir ${GENERATED_DIR}
            --hxx-suffix .hxx
            --ixx-suffix .ixx
            --cxx-suffix .cxx
            --include-regex "%include/app/(.+)%app/$1%"
            ${MODEL_HEADER}
    COMMAND ${CMAKE_COMMAND}
            -DINPUT_FILE=${GENERATED_SOURCE}
            -P ${CMAKE_CURRENT_SOURCE_DIR}/cmake/NormalizeOdbSql.cmake
    COMMAND ${CMAKE_COMMAND}
            -DINPUT_FILE=${GENERATED_HEADER}
            -P ${CMAKE_CURRENT_SOURCE_DIR}/cmake/NormalizeOdbSql.cmake
    COMMAND ${CMAKE_COMMAND}
            -DINPUT_FILE=${GENERATED_INLINE}
            -P ${CMAKE_CURRENT_SOURCE_DIR}/cmake/NormalizeOdbSql.cmake
    DEPENDS ${MODEL_HEADER}
            ${CMAKE_CURRENT_SOURCE_DIR}/cmake/NormalizeOdbSql.cmake
    COMMENT "Generating ODB persistence code"
    VERBATIM)

add_executable(course_selection_server
    src/main.cxx
    src/config.cxx
    src/json.cxx
    src/logger.cxx
    src/auth.cxx
    src/repository.cxx
    src/api.cxx
    ${GENERATED_SOURCE})

target_include_directories(course_selection_server PRIVATE
    ${CMAKE_CURRENT_SOURCE_DIR}
    ${CMAKE_CURRENT_SOURCE_DIR}/include
    ${CMAKE_CURRENT_SOURCE_DIR}/include/app
    ${GENERATED_DIR})

target_link_libraries(course_selection_server PRIVATE
    PkgConfig::ODB
    PkgConfig::ODB_MYSQL
    PkgConfig::JSONCPP
    OpenSSL::Crypto
    Threads::Threads)

target_compile_options(course_selection_server PRIVATE
    -Wall -Wextra -Wpedantic -Wno-unknown-pragmas)
