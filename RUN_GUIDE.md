# Personal Memory Hub 运行指南

这是一个基于 **pnpm monorepo** 架构的现代 Web 应用。它包含一个 **Express 后端** 和一个 **React 前端**。

## 1. 环境准备

在开始之前，请确保您的电脑已安装以下工具：
- **Node.js**: 建议版本 20 或更高。
- **pnpm**: 这是一个高效的包管理器。如果未安装，可以通过 `npm install -g pnpm` 安装。
- **PostgreSQL**: 项目使用 PostgreSQL 数据库。

## 2. 快速开始

### 第一步：安装依赖
在项目根目录下运行：
```bash
pnpm install
```

### 第二步：配置环境变量
在根目录下创建一个 `.env` 文件，并添加以下配置：
```env
# 数据库连接字符串 (例如: postgresql://user:password@localhost:5432/memory_hub)
DATABASE_URL=你的PostgreSQL连接地址

# OpenAI 配置 (用于 AI 聊天功能)
AI_INTEGRATIONS_OPENAI_API_KEY=你的OpenAI密钥
AI_INTEGRATIONS_OPENAI_BASE_URL=https://api.openai.com/v1
```

### 第三步：初始化数据库
运行以下命令将数据库模式推送到您的 PostgreSQL 实例：
```bash
pnpm --filter @workspace/db run push
```

### 第四步：启动项目
您可以同时启动后端和前端：

**启动后端 (API Server):**
```bash
cd artifacts/api-server
pnpm run dev
```

**启动前端 (Memory System):**
```bash
cd artifacts/memory-system
pnpm run dev
```

启动后，前端通常会在 `http://localhost:5173` 运行，您可以在浏览器中访问。

## 3. 项目结构说明
- `artifacts/memory-system`: 前端 React 代码（界面）。
- `artifacts/api-server`: 后端 Express 代码（接口）。
- `lib/db`: 数据库定义和连接逻辑。
- `lib/api-spec`: 接口定义。

## 4. 常见问题
- **为什么没有 index.html？**
  这是一个单页应用 (SPA)，`index.html` 位于 `artifacts/memory-system/index.html`。它需要通过 Vite 构建工具运行，而不是直接双击打开。
- **如何修改 AI 模型？**
  您可以在 `.env` 文件中配置不同的 `BASE_URL` 来适配不同的 AI 服务商。
