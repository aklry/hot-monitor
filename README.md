# Hots Monitor

Hots Monitor 是一个面向热点情报发现与风险信号追踪的全栈项目。它将关键词监控、RSS 源采集、趋势分析、通知分发和基础运维配置整合到同一个 pnpm monorepo 中，适合用来持续观察某个行业、品牌、主题或事件的舆情变化。

项目当前采用“前后端分离、共享类型”的结构：

- 前端：React 19 + Vite，负责仪表盘、监控配置、趋势详情、来源管理、通知中心和设置页。
- 后端：NestJS + Prisma + SQLite，负责抓取、分析、调度、存储和通知。
- 共享包：`packages/shared` 统一维护前后端共用的类型和 Zod schema。

---

## 1. 项目定位

这个项目主要解决三个问题：

- 持续监控指定关键词或主题，而不是手动刷信息源。
- 从多来源聚合热点内容，并结合 AI 做相关性和风险判断。
- 在发现异常、热点增长或风险信号时，尽快通过浏览器或邮件通知使用者。

典型使用场景包括：

- 品牌舆情监控
- AI / 开发工具 / 科技赛道热点跟踪
- 安全风险关键词预警
- 内容选题雷达
- 行业竞品动态观察

---

## 2. 核心功能

### 2.1 仪表盘

- 展示激活中的监控数量
- 展示当天命中数量与风险告警数量
- 展示最近通知时间线
- 展示当前启用的数据源状态
- 展示最近识别出的热点话题

### 2.2 关键词监控

- 新增关键词与监控范围（scope）
- 配置监控是否启用
- 支持立即手动执行单条监控
- 支持暂停、恢复与删除监控项
- 定时任务会按设定周期自动轮询

### 2.3 热点趋势发现

- 定期扫描趋势主题
- 为趋势生成标题、摘要、热度分、增长分和证据项
- 支持趋势列表与趋势详情页
- 支持按 scope 触发一次即时趋势分析

### 2.4 来源管理

- 支持添加 RSS 来源
- 支持测试来源是否能正常拉取样例数据
- 支持启用、禁用和删除来源
- 展示来源权重，便于后续扩展打分体系

### 2.5 通知系统

- 浏览器端通过 SSE 接收实时通知
- 支持浏览器通知权限申请
- 后端支持邮件发送能力
- 支持通知状态管理与失败重试
- 支持批量通知缓冲与定时冲刷

### 2.6 设置与成本控制

- 配置趋势扫描默认范围
- 配置趋势扫描间隔
- 配置 AI 每日 token 预算
- 查看当日 token 使用情况
- 后端提供 AI 连通性测试与邮件连通性测试接口

---

## 3. 技术栈

| 层级          | 技术                                                       |
| ------------- | ---------------------------------------------------------- |
| 包管理        | pnpm 9、workspace monorepo                                 |
| 语言          | TypeScript                                                 |
| 前端          | React 19、Vite 8、React Router 7、lucide-react             |
| 后端          | NestJS 10、RxJS、Nest Schedule                             |
| 数据层        | Prisma 7、SQLite、better-sqlite3                           |
| 校验/共享模型 | Zod                                                        |
| 内容抓取      | RSS Parser、Cheerio                                        |
| AI 调用       | OpenAI SDK 兼容方式接入 DeepSeek                           |
| 通知          | Browser Notification、SSE、Nodemailer                      |
| 测试          | Jest（API）、Vitest（Web / Shared）                        |
| 部署          | Docker、Docker Compose、GitHub Actions、GitHub Pages、GHCR |

---

## 4. 项目结构

```text
hot-monitor/
├─ apps/
│  ├─ api/                 # NestJS 后端，支持独立 Docker 部署
│  └─ web/                 # React + Vite 前端
├─ packages/
│  └─ shared/              # 前后端共享类型与 schema
├─ .github/workflows/      # CI、Docker、GitHub Pages 工作流
├─ docker-compose.yml      # 根目录：仅部署 web + 可选 rsshub
├─ docker-compose.dev.yml  # 开发阶段：可选启动 rsshub
├─ Dockerfile              # API 镜像构建文件
├─ Dockerfile.web          # Web 镜像构建文件
├─ nginx.conf              # 前端静态资源与反向代理配置
├─ .env.example            # 本地开发参考变量
└─ .env.production         # 生产变量参考文件
```

### 4.1 前端页面

前端主要页面位于 `apps/web/src/pages`：

- `Dashboard`：总览仪表盘
- `Monitors`：关键词监控管理
- `Trends`：热点趋势列表
- `TrendDetail`：趋势详情与证据
- `Sources`：来源管理
- `Notifications`：通知中心
- `Settings`：趋势设置、预算控制、浏览器通知

### 4.2 后端模块

后端主要模块位于 `apps/api/src`：

- `dashboard`：仪表盘聚合接口
- `monitors`：关键词监控 CRUD 与执行
- `trends`：趋势发现、趋势详情与手动触发
- `sources`：RSS 来源管理与测试
- `notifications`：通知查询、已读、重试、SSE
- `settings`：设置项读写、AI 测试、邮件测试
- `scheduler`：定时任务入口
- `ai`：内容分析、JSON 解析、token 统计
- `database`：Prisma 与数据库接入

---

## 5. 系统工作方式

系统的大致工作流如下：

1. 用户在前端配置关键词、监控范围和来源。
2. 后端定时任务每分钟检查哪些监控已到执行时间。
3. 来源模块拉取 RSS 或其他信号源内容。
4. AI 分析模块对内容做相关性、风险和摘要判断。
5. 结果被写入 SQLite，并生成热点、通知或风险记录。
6. 前端通过接口读取聚合数据，并通过 SSE 接收实时通知。

`JobsService` 当前每分钟执行一次主循环，负责：

- 运行到期的关键词监控
- 运行到期的趋势发现
- 冲刷到期的批量通知

---

## 6. 环境要求

建议环境：

- Node.js 20 或更高版本
- pnpm 9.15.0
- Docker / Docker Compose（如果使用容器部署）

---

## 7. 本地开发

### 7.1 安装依赖

```bash
pnpm install --frozen-lockfile
```

### 7.2 生成 Prisma Client

```bash
pnpm prisma:generate
```

### 7.3 准备环境变量

仓库中已经提供了几个参考文件：

- 根目录 `.env.example`
- 根目录 `.env.development`
- 根目录 `.env.production`
- `apps/api/.env.example`

建议做法：

- 本地开发时，以根目录 `.env.example` 或 `.env.development` 为参考准备你的运行环境变量。
- 如果采用 `apps/api` 的 Docker 独立部署，则优先使用 `apps/api/.env.example` 复制出 `apps/api/.env`。
- 前端的 `VITE_API_BASE_URL` 更推荐通过 shell、CI 或 Docker build-arg 显式注入。

### 7.4 可选启动 RSSHub

开发时如果需要 RSSHub，可单独启动：

```bash
docker compose -f docker-compose.dev.yml up -d
```

默认端口：

- RSSHub: `http://localhost:1200`

### 7.5 启动开发服务

启动前后端联调：

```bash
pnpm dev
```

只启动 API：

```bash
pnpm dev:api
```

只启动 Web：

```bash
pnpm dev:web
```

常见本地地址：

- Web: `http://localhost:5173/hot-monitor`
- API: `http://localhost:4000`
- API 健康检查: `http://localhost:4000/health`

---

## 8. 常用脚本

| 命令                   | 说明                                 |
| ---------------------- | ------------------------------------ |
| `pnpm dev`             | 同时启动 shared、api、web 的开发模式 |
| `pnpm dev:api`         | 启动 shared + api                    |
| `pnpm dev:web`         | 启动 web                             |
| `pnpm build`           | 递归构建所有包                       |
| `pnpm test`            | 递归执行测试                         |
| `pnpm lint`            | 运行 ESLint / TypeScript 检查        |
| `pnpm typecheck`       | 执行类型检查                         |
| `pnpm prisma:generate` | 生成 Prisma Client                   |
| `pnpm prisma:migrate`  | 执行 Prisma 开发迁移                 |

---

## 9. 环境变量说明

### 9.1 前端构建变量

| 变量名              | 说明                          | 示例                   |
| ------------------- | ----------------------------- | ---------------------- |
| `VITE_API_BASE_URL` | 前端构建时使用的 API 基础地址 | `http://服务器IP:4000` |

说明：

- 前端运行时代码通过 `import.meta.env.VITE_API_BASE_URL` 读取 API 地址。
- 根目录 `Dockerfile.web` 使用 `ARG` + `ENV` 将这个值暴露给 `vite build`。
- GitHub Actions 已可通过仓库变量 `vars.VITE_API_BASE_URL` 传入。

### 9.2 后端运行变量

| 变量名                     | 说明                         | 默认值 / 备注                   |
| -------------------------- | ---------------------------- | ------------------------------- |
| `DATABASE_URL`             | 数据库连接串                 | 默认 `file:./prisma/dev.db`     |
| `API_PORT`                 | API 监听端口                 | 默认 `4000`                     |
| `WEB_ORIGIN`               | 前端来源地址                 | 默认 `http://localhost:5173`    |
| `RSSHUB_BASE_URL`          | RSSHub 基础地址              | 默认 `https://rsshub.app`       |
| `X_BEARER_TOKEN`           | X / Twitter 相关源所需 token | 可选                            |
| `DEEPSEEK_API_KEY`         | DeepSeek API Key             | 建议必填                        |
| `DEEPSEEK_BASE_URL`        | AI 基础地址                  | 默认 `https://api.deepseek.com` |
| `DEEPSEEK_MODEL`           | 普通分析模型                 | 默认 `deepseek-v4-flash`        |
| `DEEPSEEK_STRICT_MODEL`    | 严格分析模型                 | 默认 `deepseek-v4-pro`          |
| `SMTP_HOST`                | SMTP 主机                    | 邮件通知需要                    |
| `SMTP_PORT`                | SMTP 端口                    | 默认 `587`                      |
| `SMTP_SECURE`              | 是否启用 SMTPS               | 默认 `false`                    |
| `SMTP_USER`                | SMTP 用户名                  | 邮件通知需要                    |
| `SMTP_PASS`                | SMTP 密码或授权码            | 邮件通知需要                    |
| `SMTP_FROM`                | 发件人地址                   | 邮件通知需要                    |
| `SMTP_TO`                  | 默认收件人地址               | 邮件通知需要                    |
| `KEYWORD_INTERVAL_MINUTES` | 默认关键词扫描周期           | 默认 `10`                       |
| `TRENDS_INTERVAL_MINUTES`  | 默认趋势扫描周期             | 默认 `60`                       |

### 9.3 运行中可在设置页调整的项

这类设置通常由系统持久化保存，而不是只依赖环境变量：

- `TRENDS_DEFAULT_SCOPE`
- `TRENDS_INTERVAL_MINUTES`
- `AI_DAILY_TOKEN_BUDGET`

---

## 10. 部署说明

这个项目当前有两条主要部署路径：

- 根目录负责 `web` 静态前端的构建与部署
- `apps/api` 负责后端 API 的独立构建与部署

### 10.1 根目录 Docker 部署：仅部署 Web

根目录的 `docker-compose.yml` 现在只包含：

- `web`
- `rsshub`（可选）

启动方式：

```bash
docker compose up -d --build
```

说明：

- `web` 使用根目录 `Dockerfile.web` 构建
- 容器内使用 `nginx` 提供前端静态文件
- 默认对外暴露 `80` 端口
- `rsshub` 默认暴露 `1200` 端口
- 这个 compose **不会启动 API**

因此在这个部署模式下，你必须保证：

- `VITE_API_BASE_URL` 指向一个可访问的独立 API 地址
- 该值在构建阶段已经传给 `Dockerfile.web`

### 10.2 API 独立 Docker 部署

API 推荐使用 `apps/api` 下的独立 compose：

```bash
cd apps/api
docker compose up -d --build
```

推荐先准备环境文件：

```bash
cd apps/api
copy .env.example .env
```

Linux / macOS 对应命令：

```bash
cp .env.example .env
```

然后修改 `.env` 中的运行参数，例如：

- `DEEPSEEK_API_KEY`
- `SMTP_*`
- `RSSHUB_BASE_URL`
- `X_BEARER_TOKEN`

这个独立 API 部署的特性：

- 使用 `apps/api/Dockerfile`
- 启动时自动执行 `prisma migrate deploy`
- SQLite 数据默认持久化到 Docker volume
- 默认对外暴露 `4000` 端口
- 健康检查地址为 `/health`

### 10.3 GitHub Pages 部署前端

仓库内置了 `.github/workflows/pages.yml`：

- 触发条件：推送到 `master` 或手动触发
- 构建流程：安装依赖 -> 生成 Prisma Client -> 构建 shared -> 构建 web -> 发布到 Pages
- Pages 构建阶段会从 `vars.VITE_API_BASE_URL` 读取前端 API 地址

注意事项：

- 前端路由使用了 `BrowserRouter basename="/hot-monitor"`，适配 GitHub Pages 子路径部署
- 如果 Pages 页面请求到了错误的 API 地址，优先检查仓库变量 `VITE_API_BASE_URL`

### 10.4 GHCR Docker 镜像自动构建

仓库内置了 `.github/workflows/docker.yml`，会在推送到 `master` 或打标签时自动构建并推送镜像。

当前会生成两类镜像：

- API 镜像：基于根目录 `Dockerfile`
- Web 镜像：基于根目录 `Dockerfile.web`

其中：

- Web 镜像构建时会通过 `build-args` 注入 `VITE_API_BASE_URL`
- 推送目标为 GHCR（GitHub Container Registry）

---

## 11. CI 与自动化

### 11.1 CI

`.github/workflows/ci.yml` 会执行：

- 安装依赖
- 生成 Prisma Client
- 构建共享包
- Lint
- Type Check
- Test

### 11.2 Docker 自动构建

`.github/workflows/docker.yml` 负责：

- 登录 GHCR
- 构建 API / Web Docker 镜像
- 自动打 tag
- 推送镜像到容器仓库

### 11.3 Pages 自动发布

`.github/workflows/pages.yml` 负责：

- 构建前端静态资源
- 发布到 GitHub Pages

---

## 12. 数据与持久化

默认情况下，后端使用 SQLite。

开发环境默认：

- `file:./prisma/dev.db`

Docker API 部署默认：

- `file:/app/data/prod.db`

这意味着：

- 本地开发可以快速启动，无需额外数据库服务
- 生产环境需要关注 Docker volume 的备份与迁移

---

## 13. 排障建议

### 13.1 前端请求错了 API 地址

优先检查：

- `VITE_API_BASE_URL` 是否在构建阶段正确传入
- GitHub Actions 仓库变量 `VITE_API_BASE_URL` 是否已设置
- Pages / Docker 是否重新触发了构建

### 13.2 根目录 compose 启动后没有 API

这是当前设计使然。根目录 `docker-compose.yml` 只负责：

- `web`
- `rsshub`

如果需要 API，请单独进入 `apps/api` 目录启动独立 compose。

### 13.3 API 启动失败

建议检查：

- `DEEPSEEK_API_KEY` 是否配置
- `DATABASE_URL` 是否可写
- `SMTP_*` 是否完整
- `RSSHUB_BASE_URL` 是否可访问
- `/health` 是否返回 `{ "ok": true }`

### 13.4 浏览器通知没有弹出

优先检查：

- 浏览器是否已授予通知权限
- 页面是否通过 HTTPS 或 localhost 访问
- 后端 SSE 是否正常连接到 `/notifications/stream`

---

## 14. 继续扩展的方向

- 增加更多来源类型，而不仅限于 RSS
- 增加多租户或多项目监控
- 引入更完整的通知策略与告警分级
- 增加趋势聚类、去重与来源可信度评分
- 增加用户系统与权限控制
- 引入 PostgreSQL 等更适合生产的数据库

---

## 15. 总结

Hots Monitor 目前已经具备一个完整热点监控系统的基本骨架：

- 前端可视化控制台
- 后端监控与分析引擎
- 共享类型与 schema
- 独立的 Web / API 部署路径
- GitHub Actions 自动化构建与发布能力
