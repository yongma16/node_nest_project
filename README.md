# AI Proxy Backend

基于 NestJS 的 AI 代理后端服务，支持多种 AI 模型接入，包括 OpenAI 和 Kimi (Moonshot AI)。

## 功能特性

- 🤖 **多 AI 模型支持**: OpenAI GPT 系列、Kimi (Moonshot AI)
- 💬 **多轮对话**: 支持上下文记忆的连续对话
- 🔄 **智能历史管理**: 自动管理对话历史，避免 token 超限
- 📝 **完整的 API 文档**: 集成 Swagger 文档
- 🛡️ **错误处理**: 完善的错误处理和日志记录
- ⚡ **高性能**: 基于 NestJS 框架，支持高并发

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 环境配置

复制 `.env.example` 到 `.env` 并配置相关参数：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
# AI 通用配置
AI_BASE_URL=https://api.openai.com/v1
AI_API_KEY=your_openai_api_key_here
AI_MODEL=gpt-4o-mini
AI_TIMEOUT_MS=60000

# Kimi API 配置
KIMI_API_KEY=your_kimi_api_key_here
KIMI_TIMEOUT_MS=60000

# 应用配置
PORT=3000
NODE_ENV=development
```

### 3. 获取 API Keys

#### OpenAI API Key
1. 访问 [OpenAI Platform](https://platform.openai.com/api-keys)
2. 创建新的 API Key

#### Kimi API Key
1. 访问 [Moonshot AI 平台](https://platform.moonshot.cn/console)
2. 注册账号并登录
3. 在 "API Key 管理" 中创建新的 API Key

### 4. 启动服务

```bash
# 开发模式
npm run start:dev

# 生产模式
npm run start:prod
```

服务将在 `http://localhost:3000` 启动。

## API 文档

启动服务后，访问 `http://localhost:3000/api` 查看完整的 Swagger API 文档。

## 主要 API 端点

### 通用 Chat Completions
```
POST /v1/chat/completions
```

### Kimi 专用接口

#### 单次对话
```
POST /v1/kimi/chat
```

#### 多轮对话
```
POST /v1/kimi/multi-turn-chat
```

#### 获取可用模型
```
GET /v1/kimi/models
```

## 使用示例

详细的使用示例请查看 [examples/kimi-usage.md](./examples/kimi-usage.md)

### 快速示例 - 多轮对话

```typescript
// 发送第一条消息
const response1 = await fetch('http://localhost:3000/v1/kimi/multi-turn-chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: '你好，我是小明',
    model: 'moonshot-v1-8k'
  })
});

const data1 = await response1.json();
console.log('AI:', data1.reply);

// 发送第二条消息（带历史记录）
const response2 = await fetch('http://localhost:3000/v1/kimi/multi-turn-chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: '我刚才说我叫什么名字？',
    history: data1.history,
    model: 'moonshot-v1-8k'
  })
});

const data2 = await response2.json();
console.log('AI:', data2.reply); // AI 会记住你叫小明
```

## 项目结构

```
src/
├── ai/                     # AI 相关模块
│   ├── dto/               # 数据传输对象
│   │   ├── chat-completion.dto.ts
│   │   ├── kimi-chat.dto.ts
│   │   └── multi-turn-chat.dto.ts
│   ├── ai.controller.ts   # 控制器
│   ├── ai.service.ts      # 通用 AI 服务
│   ├── kimi.service.ts    # Kimi 专用服务
│   └── ai.module.ts       # 模块配置
├── app.controller.ts
├── app.module.ts
└── main.ts
```

## 开发

```bash
# 开发模式
npm run start:dev

# 代码格式化
npm run format

# 代码检查
npm run lint

# 运行测试
npm run test

# 构建
npm run build
```

## 部署

```bash
# 构建生产版本
npm run build

# 启动生产服务
npm run start:prod
```

## 支持的模型

### OpenAI 模型
- gpt-4o
- gpt-4o-mini
- gpt-4-turbo
- gpt-3.5-turbo

### Kimi 模型
- moonshot-v1-8k (8K tokens)
- moonshot-v1-32k (32K tokens)
- moonshot-v1-128k (128K tokens)

## 注意事项

1. **API Key 安全**: 请妥善保管 API Keys，不要提交到版本控制系统
2. **费用控制**: AI API 按使用量计费，建议设置合理的使用限制
3. **错误处理**: 生产环境请添加适当的错误处理和监控
4. **性能优化**: 根据实际需求调整超时时间和并发限制

## 许可证

[MIT licensed](LICENSE).
