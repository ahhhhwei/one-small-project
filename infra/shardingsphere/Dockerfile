# syntax=docker/dockerfile:1

FROM apache/shardingsphere-proxy:5.3.2

USER root

ARG MYSQL_CONNECTOR_VERSION=8.4.0
ARG MYSQL_CONNECTOR_SHA1=b1bc0f47bcad26ad5f9bceefb63fcb920d868fca

ADD https://repo1.maven.org/maven2/com/mysql/mysql-connector-j/${MYSQL_CONNECTOR_VERSION}/mysql-connector-j-${MYSQL_CONNECTOR_VERSION}.jar /opt/shardingsphere-proxy/ext-lib/mysql-connector-j.jar

RUN apt-get update \
    && apt-get install -y --no-install-recommends gettext-base \
    && echo "${MYSQL_CONNECTOR_SHA1}  /opt/shardingsphere-proxy/ext-lib/mysql-connector-j.jar" | sha1sum -c - \
    && find /opt/shardingsphere-proxy/conf -maxdepth 1 -type f -name 'config-*.yaml' -delete \
    && rm -f /opt/shardingsphere-proxy/conf/server.yaml \
    && rm -rf /var/lib/apt/lists/*

COPY config-docker.yaml.template server-docker.yaml.template /opt/course-config/
COPY docker-entrypoint.sh /usr/local/bin/course-proxy-entrypoint

RUN chmod 0755 /usr/local/bin/course-proxy-entrypoint

EXPOSE 3307

ENTRYPOINT ["/usr/local/bin/course-proxy-entrypoint"]
