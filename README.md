# 学生选课管理系统

这是一个前后端分离的学生选课项目，分为管理员、教师和学生三种账号。前端使用 React，
后端使用 C++，数据通过 ShardingSphere-Proxy 分到 MySQL 和 openGauss。

项目目前可以跑通登录、学生管理、课程管理、选课、退课和成绩录入这些基本流程。

## 用到的技术

- React 18、TypeScript、Ant Design Pro
- C++17、cpp-httplib
- ODB、JsonCpp、OpenSSL
- MySQL、openGauss、ShardingSphere-Proxy
- CMake、Docker Compose、Nginx

Docker 方式只对外开放 `8000` 端口，由 Nginx 提供前端页面并把 `/api` 请求转发给
后端。手动开发时，前端、后端和 ShardingSphere-Proxy 分别使用 `8000`、`8080` 和
`3307` 端口。

## 功能

### 管理员

- 查看、搜索、新增、修改和删除学生
- 查看、新增、修改和删除课程
- 管理学生的选课记录和成绩
- 删除学生或课程时，同时清理对应的选课记录

### 教师

- 查看自己负责的课程
- 查看课程中的学生名单
- 录入和修改学生成绩
- 不能修改其他教师课程的数据

### 学生

- 查看自己的个人信息
- 查看已选课程和成绩
- 查看当前可以选择的课程
- 选课和退课

权限不只是在前端控制，后端接口也会检查当前账号的身份。

## 测试账号

| 身份   | 用户名      | 密码          | 说明                     |
| ------ | ----------- | ------------- | ------------------------ |
| 管理员 | `admin`     | `Admin@123`   | 管理学生、课程和选课记录 |
| 教师   | `teacher01` | `Teacher@123` | 绑定教师“蒋莉”           |
| 学生   | `student01` | `Student@123` | 绑定学号 `20000001`      |

这些账号只用于本地测试。

## 项目目录

```text
.
├── .devcontainer                 Codespaces 配置
├── CMakeLists.txt                根目录 CMake 入口
├── docker-compose.yml            Docker Compose 入口
├── backend
│   ├── CMakeLists.txt
│   ├── Dockerfile
│   ├── include/app                后端头文件
│   ├── src                        后端实现
│   ├── migrations                MySQL 和 openGauss 迁移文件
│   └── cmake                      ODB 生成代码处理脚本
├── frontend/ant-design-pro        前端项目和 Nginx 配置
├── infra
│   ├── mysql                      MySQL 初始化脚本
│   ├── opengauss                  openGauss 初始化脚本
│   ├── seed                       测试数据导入镜像
│   └── shardingsphere             ShardingSphere 配置和镜像
└── tools
    ├── generate_large_data.py     测试数据生成脚本
    ├── smoke_test.sh              接口冒烟测试
    └── start_proxy.sh             代理启动脚本
```

## Docker 启动

这是最省事的运行方式，需要先安装 Docker Engine 和 Docker Compose v2。复制环境变量文件：

```bash
cp .env.example .env
```

打开 `.env`，至少修改 `MYSQL_ROOT_PASSWORD`、`OPENGAUSS_PASSWORD`、
`SHARDINGSPHERE_PASSWORD` 和 `AUTH_SECRET`。`AUTH_SECRET` 可以这样生成：

```bash
openssl rand -hex 32
```

构建并启动全部服务：

```bash
docker compose up -d --build
docker compose ps
```

第一次构建会下载 openGauss、ShardingSphere、ODB 和前端依赖，需要等几分钟。数据库建表后会
自动导入 1000 名学生、78 门课程和对应的选课记录；再次启动时如果已经有学生数据，就不会重复
导入。

服务启动后访问 <http://localhost:8000/user/login>，也可以先检查接口：

```bash
curl http://localhost:8000/api/health
API_BASE=http://localhost:8000 ./tools/smoke_test.sh
```

容器之间通过 Compose 网络通信，宿主机只开放前端的 `8000` 端口。常用命令：

```bash
docker compose logs -f backend
docker compose logs -f shardingsphere
docker compose stop
docker compose start
docker compose down
```

`docker compose down` 不会删除数据库卷。只有确定不再需要本地数据时，才使用
`docker compose down -v` 重新初始化数据库。

### 在 GitHub Codespaces 中运行

仓库中的 `.devcontainer/devcontainer.json` 会准备 Docker 环境并转发 `8000` 端口。创建
Codespace 后执行：

```bash
cp -n .env.example .env
docker compose up -d --build
curl http://localhost:8000/api/health
```

如果需要把演示地址发给别人，在 Codespaces 的 `PORTS` 面板中找到 `8000`，把端口可见性改成
`Public`。演示结束后执行 `docker compose stop`，并停止 Codespace。

## 本地运行

下面是不用 Docker 时的运行方法。我使用的环境是 Ubuntu 20.04、GCC 9.4 和 Node.js 20。
后端还需要安装这些依赖：

- CMake 3.16 或更高版本
- ODB 2.6、`libodb`、`libodb-mysql`
- JsonCpp
- OpenSSL
- pthread

### 1. 启动数据库和代理

先确认 MySQL 和 openGauss 已经启动，再把项目中的配置复制到 ShardingSphere-Proxy：

```bash
cp infra/shardingsphere/config-wenjw.yaml infra/shardingsphere/proxy/conf/config-wenjw.yaml
cp infra/shardingsphere/server.yaml infra/shardingsphere/proxy/conf/server.yaml

./tools/start_proxy.sh
```

默认端口如下：

| 服务                 |    端口 |
| -------------------- | ------: |
| ShardingSphere-Proxy |  `3307` |
| MySQL                | `13306` |
| openGauss            | `15432` |

第一次运行时，需要分别创建两边的用户表：

```bash
mysql -h127.0.0.1 -P13306 -uroot -p123456 wenjw_db0 \
  < backend/migrations/mysql/001_create_user.sql

docker exec -i one-small-project-opengauss-db1 sh -lc \
  'su - omm -c "gsql -d wenjw_db1"' \
  < backend/migrations/opengauss/001_create_user.sql
```

迁移脚本可以重复执行。

### 2. 编译后端

所有后端代码都从根目录统一编译：

```bash
cmake -S . -B build -DCMAKE_BUILD_TYPE=Release
cmake --build build -j2
```

CMake 会先调用 ODB 编译器生成数据库持久化代码，然后再编译后端程序。生成文件位于
`build/backend/generated`，不需要手动修改。

### 3. 配置后端

默认配置放在 [.env.example](.env.example)，可以复制一份再按本机环境修改：

```bash
cp .env.example .env
```

程序读取的是环境变量。如果需要使用 `.env` 文件，在启动前执行：

```bash
set -a
source .env
set +a
```

常用配置：

| 变量               | 默认值         | 说明             |
| ------------------ | -------------- | ---------------- |
| `DB_HOST`          | `127.0.0.1`    | 数据库代理地址   |
| `DB_PORT`          | `3307`         | 数据库代理端口   |
| `DB_NAME`          | `wenjw_db`     | 逻辑数据库名     |
| `DB_USER`          | `root`         | 数据库用户名     |
| `DB_PASSWORD`      | `123456`       | 数据库密码       |
| `APP_HOST`         | `0.0.0.0`      | 后端监听地址     |
| `APP_PORT`         | `8080`         | 后端端口         |
| `AUTH_SECRET`      | 开发环境默认值 | 登录令牌签名密钥 |
| `AUTH_TOKEN_HOURS` | `8`            | 登录有效时间     |
| `LOG_DIR`          | `logs`         | 日志目录         |

`AUTH_SECRET` 至少需要 32 个字符。部署时应换成自己的随机字符串，并保证每次启动使用
同一个值，否则原来的登录令牌会失效。

### 4. 启动后端

```bash
./build/backend/course_selection_server
```

启动成功后可以访问健康检查：

```bash
curl http://127.0.0.1:8080/api/health
```

### 5. 启动前端

另开一个终端：

```bash
cd frontend/ant-design-pro
npm install
npm run start
```

浏览器访问 <http://localhost:8000/user/login>。开发环境中的 `/api` 请求会转发到
`http://localhost:8080`。

## 日志

后端日志会同时输出到终端和 `logs/backend-YYYY-MM-DD.jsonl`。每行是一条 JSON，主要记录：

- 请求方法、路径、状态码和响应大小
- 登录成功、登录失败和令牌校验失败
- 权限不足
- 数据库异常和程序异常
- 服务启动和端口占用

日志里不会写入密码、登录令牌和数据库密码。

```bash
tail -f logs/backend-$(date -u +%F).jsonl
```

使用 Docker 时可以直接查看容器日志：

```bash
docker compose logs -f backend
```

## 检查和测试

后端正在运行时，可以执行接口冒烟测试：

```bash
./tools/smoke_test.sh
```

脚本会测试三类账号登录、管理员增删改查、越权访问、教师录入成绩，以及学生选课和退课。
测试过程中创建的数据会在结束时删除。

前端检查：

```bash
cd frontend/ant-design-pro
npm run tsc
npm run lint:js
npm run build
```

## 接口

| 方法             | 路径                                 | 说明                 |
| ---------------- | ------------------------------------ | -------------------- |
| `POST`           | `/api/auth/login`                    | 登录                 |
| `GET`            | `/api/auth/me`                       | 获取当前账号         |
| `POST`           | `/api/auth/logout`                   | 退出登录             |
| `GET`            | `/api/health`                        | 健康检查             |
| `GET/POST`       | `/api/students`                      | 查询或新增学生       |
| `GET/PUT/DELETE` | `/api/students/:sno`                 | 查询、修改或删除学生 |
| `GET/POST`       | `/api/courses`                       | 查询或新增课程       |
| `PUT/DELETE`     | `/api/courses/:cno`                  | 修改或删除课程       |
| `GET`            | `/api/course_students/:cno`          | 查询课程中的学生     |
| `GET`            | `/api/student_courses/:sno`          | 查询学生的课程       |
| `POST`           | `/api/enrollments`                   | 新增选课记录         |
| `PUT/DELETE`     | `/api/enrollments/:sno/:cno`         | 修改或删除选课记录   |
| `GET`            | `/api/teacher/courses`               | 教师的课程           |
| `GET`            | `/api/teacher/courses/:cno/students` | 教师查看课程名单     |
| `PUT`            | `/api/teacher/enrollments/:sno/:cno` | 教师修改成绩         |
| `GET`            | `/api/student/profile`               | 学生个人信息         |
| `GET`            | `/api/student/courses`               | 学生已选课程         |
| `GET`            | `/api/student/available-courses`     | 学生可选课程         |
| `POST/DELETE`    | `/api/student/enrollments/:cno`      | 学生选课或退课       |

登录以外的接口需要在请求头中携带令牌：

```text
Authorization: Bearer <token>
```

请求和响应使用 JSON。接口出错时会返回对应的 HTTP 状态码和错误信息。
