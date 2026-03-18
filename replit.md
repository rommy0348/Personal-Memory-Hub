# Workspace

## Overview

AI Memory Management System (AI记忆管理系统) — A personalized AI information hub with dynamic memory capture, organization, and intelligent recall. Built as a pnpm monorepo with TypeScript.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **AI**: OpenAI via Replit AI Integrations (gpt-5.2)
- **Frontend**: React + Vite + TailwindCSS + shadcn/ui

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server
│   └── memory-system/      # React frontend (AI Memory Management UI)
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   ├── db/                 # Drizzle ORM schema + DB connection
│   └── integrations-openai-ai-server/ # OpenAI AI integration
├── scripts/
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## Database Schema

- **folders** — hierarchical folder structure (memory/plan/material types)
- **memories** — memory cards with emotion weight, keywords, library type
- **chat_messages** — AI chat message history

## Key Features

1. **三库系统**: 记忆库 / 计划库 / 资料库 (Memory / Plan / Material libraries)
2. **情感权重**: Emotion weight scoring (0-1) with auto-computation and labels
3. **智能召回**: AI retrieves top-5 relevant memories per chat context using weighted scoring
4. **文件夹树**: Multi-level folder hierarchy with memory card organization
5. **关键词搜索**: Keyword-based search across all memories
6. **AI聊天**: Full AI chat with memory-augmented responses, Claude-style layout with Markdown + syntax highlighting rendering
7. **通用API适配器**: Universal OpenAI-compatible API adapter — supports Replit AI, OpenAI, Claude, DeepSeek, Ollama, custom endpoints; settings persisted in localStorage
8. **侧边栏折叠**: Animated folder tree collapse/expand toggle in the memory panel
9. **记录编辑**: Full inline edit mode on memory detail modals (title, content, keywords, importance)

## API Endpoints

- `GET /api/folders` - folder tree
- `POST /api/folders` - create folder
- `GET /api/memories` - list memories (with folderId/search/libraryType filters)
- `POST /api/memories` - create memory (auto-computes emotion weight + keywords)
- `PUT /api/memories/:id` - update memory
- `DELETE /api/memories/:id` - delete memory
- `POST /api/ai/chat` - AI chat with memory retrieval
- `POST /api/ai/memories/retrieve` - retrieve relevant memories for context
- `GET /api/chat/messages` - chat message history

## Environment Variables

- `DATABASE_URL` — PostgreSQL connection string (auto-provisioned by Replit)
- `AI_INTEGRATIONS_OPENAI_BASE_URL` — OpenAI proxy URL (auto-configured)
- `AI_INTEGRATIONS_OPENAI_API_KEY` — OpenAI API key (auto-configured)

## Development

- Run codegen: `pnpm --filter @workspace/api-spec run codegen`
- Push DB schema: `pnpm --filter @workspace/db run push`
- Typecheck: `pnpm run typecheck`
