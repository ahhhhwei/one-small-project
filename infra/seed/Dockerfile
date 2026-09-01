# syntax=docker/dockerfile:1

FROM python:3.12-slim AS generator

COPY tools/generate_large_data.py /tmp/generate_large_data.py
RUN python /tmp/generate_large_data.py --students 1000 --output /tmp/seed.sql

FROM mysql:8.0.38

COPY --from=generator /tmp/seed.sql /docker-seed/seed.sql
COPY infra/seed/seed.sh /usr/local/bin/course-seed

RUN chmod 0755 /usr/local/bin/course-seed

ENTRYPOINT ["/usr/local/bin/course-seed"]
