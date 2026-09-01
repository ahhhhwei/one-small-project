# syntax=docker/dockerfile:1

ARG ODB_VERSION=2.6.0
ARG ODB_BASE_URL=https://codesynthesis.com/download/odb/2.6.0/ubuntu/ubuntu24.04/x86_64

FROM ubuntu:24.04 AS odb-packages

ARG ODB_VERSION
ARG ODB_BASE_URL

WORKDIR /tmp/odb

ADD ${ODB_BASE_URL}/odb_${ODB_VERSION}-0~ubuntu24.04_amd64.deb ./
ADD ${ODB_BASE_URL}/libodb_${ODB_VERSION}-0~ubuntu24.04_amd64.deb ./
ADD ${ODB_BASE_URL}/libodb-dev_${ODB_VERSION}-0~ubuntu24.04_amd64.deb ./
ADD ${ODB_BASE_URL}/libodb-mysql_${ODB_VERSION}-0~ubuntu24.04_amd64.deb ./
ADD ${ODB_BASE_URL}/libodb-mysql-dev_${ODB_VERSION}-0~ubuntu24.04_amd64.deb ./
ADD ${ODB_BASE_URL}/packages.sha256 ./

RUN sha256sum --ignore-missing -c packages.sha256

FROM ubuntu:24.04 AS builder

ARG ODB_VERSION

COPY --from=odb-packages /tmp/odb /tmp/odb

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        cmake \
        g++ \
        pkg-config \
        default-libmysqlclient-dev \
        libjsoncpp-dev \
        libssl-dev \
        "/tmp/odb/odb_${ODB_VERSION}-0~ubuntu24.04_amd64.deb" \
        "/tmp/odb/libodb_${ODB_VERSION}-0~ubuntu24.04_amd64.deb" \
        "/tmp/odb/libodb-dev_${ODB_VERSION}-0~ubuntu24.04_amd64.deb" \
        "/tmp/odb/libodb-mysql_${ODB_VERSION}-0~ubuntu24.04_amd64.deb" \
        "/tmp/odb/libodb-mysql-dev_${ODB_VERSION}-0~ubuntu24.04_amd64.deb" \
    && rm -rf /var/lib/apt/lists/*

RUN apt-get update \
    && apt-get install -y --no-install-recommends ninja-build \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /src
COPY CMakeLists.txt ./
COPY backend ./backend

RUN cmake -S . -B build -G Ninja -DCMAKE_BUILD_TYPE=Release \
    && cmake --build build -j2

FROM ubuntu:24.04 AS runtime

ARG ODB_VERSION

COPY --from=odb-packages /tmp/odb /tmp/odb

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        ca-certificates \
        curl \
        libjsoncpp25 \
        libmysqlclient21 \
        libssl3t64 \
        "/tmp/odb/libodb_${ODB_VERSION}-0~ubuntu24.04_amd64.deb" \
        "/tmp/odb/libodb-mysql_${ODB_VERSION}-0~ubuntu24.04_amd64.deb" \
    && rm -rf /var/lib/apt/lists/* /tmp/odb \
    && useradd --uid 10001 --create-home --shell /usr/sbin/nologin course-app \
    && install -d -o course-app -g course-app /app/logs

WORKDIR /app
COPY --from=builder /src/build/backend/course_selection_server ./course_selection_server

USER course-app

EXPOSE 8080

HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=10 \
    CMD curl -fsS http://127.0.0.1:8080/api/health || exit 1

ENTRYPOINT ["./course_selection_server"]
