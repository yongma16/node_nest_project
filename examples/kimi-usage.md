# Kimi API 使用示例

## 环境配置

1. 在 [Moonshot AI 平台](https://platform.moonshot.cn/console) 注册账号并获取 API Key
2. 在项目根目录创建 `.env` 文件，添加以下配置：

```env
KIMI_API_KEY=your_kimi_api_key_here
KIMI_TIMEOUT_MS=60000
```

## API 端点

### 1. 单次对话 - `/v1/kimi/chat`

```bash
curl -X POST http://localhost:3000/v1/kimi/chat \
  -H "Content-Type: application/json" \
  -d '{
    "model": "moonshot-v1-8k",
    "messages": [
      {
        "role": "system",
        "content": "你是 Kimi，由 Moonshot AI 提供的人工智能助手"
      },
      {
        "role": "user",
        "content": "你好，请介绍一下你自己"
      }
    ],
    "temperature": 0.3,
    "max_tokens": 1024
  }'
```

### 2. 多轮对话 - `/v1/kimi/multi-turn-chat`

```bash
curl -X POST http://localhost:3000/v1/kimi/multi-turn-chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "我想了解人工智能的发展历史",
    "history": [
      {
        "role": "user",
        "content": "你好"
      },
      {
        "role": "assistant", 
        "content": "你好！我是 Kimi，很高兴为你服务。"
      }
    ],
    "model": "moonshot-v1-8k",
    "systemPrompt": "你是一个专业的技术顾问，请用简洁明了的语言回答用户的技术问题。"
  }'
```

### 3. 获取可用模型 - `/v1/kimi/models`

```bash
curl -X GET http://localhost:3000/v1/kimi/models
```

## JavaScript/TypeScript 示例

### 单次对话

```typescript
async function kimiChat() {
  const response = await fetch('http://localhost:3000/v1/kimi/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'moonshot-v1-8k',
      messages: [
        {
          role: 'user',
          content: '请解释一下什么是机器学习？'
        }
      ],
      temperature: 0.3
    })
  });
  
  const data = await response.json();
  console.log(data.choices[0].message.content);
}
```

### 多轮对话管理

```typescript
class KimiChatSession {
  private history: Array<{role: string, content: string}> = [];
  private apiUrl = 'http://localhost:3000/v1/kimi/multi-turn-chat';
  
  async sendMessage(message: string, model = 'moonshot-v1-8k') {
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        history: this.history,
        model,
        systemPrompt: '你是一个友好的助手，请用简洁明了的语言回答问题。'
      })
    });
    
    const data = await response.json();
    
    // 更新本地历史记录
    this.history = data.history;
    
    return {
      reply: data.reply,
      usage: data.usage
    };
  }
  
  clearHistory() {
    this.history = [];
  }
  
  getHistory() {
    return [...this.history];
  }
}

// 使用示例
const chatSession = new KimiChatSession();

async function example() {
  const response1 = await chatSession.sendMessage('你好，我是小明');
  console.log('AI:', response1.reply);
  
  const response2 = await chatSession.sendMessage('我刚才说我叫什么名字？');
  console.log('AI:', response2.reply); // AI 会记住你叫小明
  
  console.log('Token 使用:', response2.usage);
}
```

## 模型选择

- **moonshot-v1-8k**: 适合短对话，支持约 8k tokens
- **moonshot-v1-32k**: 适合中等长度对话，支持约 32k tokens  
- **moonshot-v1-128k**: 适合长文档处理，支持约 128k tokens

## 注意事项

1. **API Key 安全**: 请妥善保管你的 API Key，不要在客户端代码中暴露
2. **Token 限制**: 不同模型有不同的 token 限制，请根据需要选择合适的模型
3. **费用控制**: Kimi API 按 token 使用量计费，建议设置合理的 `max_tokens` 参数
4. **对话历史管理**: 系统会自动管理对话历史长度，避免超出 token 限制
5. **错误处理**: 请在生产环境中添加适当的错误处理逻辑

## 错误码说明

- `400`: 请求参数错误（如无效的模型名称）
- `401`: API Key 无效或缺失
- `429`: 请求频率超限
- `500`: 服务器内部错误
- `502`: Kimi API 服务不可用