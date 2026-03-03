import { HttpService } from '@nestjs/axios';
import { HttpException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';
import { KimiChatRequestDto, KimiChatResponseDto, KimiMessage } from './dto/kimi-chat.dto';
import { KimiImageChatRequestDto } from './dto/kimi-image-chat.dto';
import { KimiImageUrlChatRequestDto } from './dto/kimi-image-url-chat.dto';

@Injectable()
export class KimiService {
  private readonly logger = new Logger(KimiService.name);
  private readonly kimiBaseUrl = 'https://api.moonshot.cn/v1';
  private readonly validModels = [
    'moonshot-v1-8k',
    'moonshot-v1-32k',
    'moonshot-v1-128k',
    'kimi-k2-turbo-preview',
    'kimi-k2.5',
    'kimi-k2.5-turbo-preview',
    'kimi-k2.5-pro-preview',
  ];

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * 调用 Kimi API 进行单次对话
   */
  async chatCompletion(payload: KimiChatRequestDto): Promise<KimiChatResponseDto> {
    const apiKey = this.configService.get<string>('KIMI_API_KEY');
    const timeoutMs = Number(this.configService.get<string>('KIMI_TIMEOUT_MS') ?? 60000);

    if (!apiKey) {
      throw new InternalServerErrorException(
        'Missing KIMI_API_KEY. Please set it in your environment variables.',
      );
    }

    if (!this.validModels.includes(payload.model)) {
      throw new HttpException(`Invalid model. Supported models: ${this.validModels.join(', ')}`, 400);
    }
    const temperature = this.resolveTemperature(payload.model, payload.temperature);
    const topP = this.resolveTopP(payload.model, payload.top_p);

    try {
      this.logger.log(`Calling Kimi API with model: ${payload.model}`);

      const response = await firstValueFrom(
        this.httpService.post(
          `${this.kimiBaseUrl}/chat/completions`,
          {
            model: payload.model,
            messages: payload.messages,
            temperature,
            max_tokens: payload.max_tokens ?? 1024,
            stream: payload.stream ?? false,
            top_p: topP,
          },
          {
            timeout: timeoutMs,
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      this.logger.log(
        `Kimi API response received, tokens used: ${response.data.usage?.total_tokens || 'unknown'}`,
      );
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      const statusCode = axiosError.response?.status ?? 502;
      const responseBody = axiosError.response?.data ?? {
        message: 'Kimi API request failed.',
      };

      this.logger.error(`Kimi API error: ${JSON.stringify(responseBody)}`);
      throw new HttpException(responseBody, statusCode);
    }
  }

  async imageChatCompletion(payload: KimiImageChatRequestDto): Promise<KimiChatResponseDto> {
    const apiKey = this.configService.get<string>('KIMI_API_KEY');
    const timeoutMs = Number(this.configService.get<string>('KIMI_TIMEOUT_MS') ?? 60000);

    if (!apiKey) {
      throw new InternalServerErrorException(
        'Missing KIMI_API_KEY. Please set it in your environment variables.',
      );
    }

    const model = payload.model ?? 'kimi-k2.5-turbo-preview';
    if (!this.validModels.includes(model)) {
      throw new HttpException(`Invalid model. Supported models: ${this.validModels.join(', ')}`, 400);
    }
    if (!payload.imageBase64?.trim()) {
      throw new HttpException('imageBase64 is required', 400);
    }
    if (!payload.prompt?.trim()) {
      throw new HttpException('prompt is required', 400);
    }
    const temperature = this.resolveTemperature(model, payload.temperature);
    const topP = this.resolveTopP(model, payload.top_p);

    const imageDataUrl = this.buildImageDataUrl(payload.imageBase64, payload.imageMimeType);

    try {
      this.logger.log(`Calling Kimi image chat API with model: ${model}`);
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.kimiBaseUrl}/chat/completions`,
          {
            model,
            messages: [
              {
                role: 'system',
                content: payload.systemPrompt?.trim() || '你是 Kimi。',
              },
              {
                role: 'user',
                content: [
                  {
                    type: 'image_url',
                    image_url: {
                      url: imageDataUrl,
                    },
                  },
                  {
                    type: 'text',
                    text: payload.prompt.trim(),
                  },
                ],
              },
            ],
            temperature,
            max_tokens: payload.max_tokens ?? 1024,
            top_p: topP,
            stream: false,
          },
          {
            timeout: timeoutMs,
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      const statusCode = axiosError.response?.status ?? 502;
      const responseBody = axiosError.response?.data ?? {
        message: 'Kimi image chat request failed.',
      };
      this.logger.error(`Kimi image chat error: ${JSON.stringify(responseBody)}`);
      throw new HttpException(responseBody, statusCode);
    }
  }

  async imageUrlChatCompletion(payload: KimiImageUrlChatRequestDto): Promise<KimiChatResponseDto> {
    if (!payload.imageUrl?.trim()) {
      throw new HttpException('imageUrl is required', 400);
    }
    if (!payload.prompt?.trim()) {
      throw new HttpException('prompt is required', 400);
    }

    const { imageBase64, imageMimeType } = await this.fetchImageAsBase64(payload.imageUrl.trim());
    return this.imageChatCompletion({
      userId: payload.userId,
      sessionId: payload.sessionId,
      model: payload.model,
      systemPrompt: payload.systemPrompt,
      imageBase64,
      imageMimeType,
      prompt: payload.prompt,
      temperature: payload.temperature,
      max_tokens: payload.max_tokens,
      top_p: payload.top_p,
    });
  }

  /**
   * 多轮对话支持 - 管理对话历史
   */
  async multiTurnChat(
    userMessage: string,
    conversationHistory: KimiMessage[] = [],
    model: string = 'moonshot-v1-8k',
    systemPrompt?: string,
  ): Promise<{
    response: KimiChatResponseDto;
    updatedHistory: KimiMessage[];
  }> {
    // 构建消息历史
    const messages: KimiMessage[] = [];

    // 添加系统提示（如果提供）
    if (systemPrompt) {
      messages.push({
        role: 'system',
        content: systemPrompt,
      });
    }

    // 添加历史对话
    messages.push(...conversationHistory);

    // 添加当前用户消息
    messages.push({
      role: 'user',
      content: userMessage,
    });

    // 调用 Kimi API
    const response = await this.chatCompletion({
      model,
      messages,
    });

    // 更新对话历史
    const updatedHistory = [...conversationHistory];
    updatedHistory.push({
      role: 'user',
      content: userMessage,
    });

    if (response.choices && response.choices.length > 0) {
      updatedHistory.push({
        role: 'assistant',
        content: response.choices[0].message.content,
      });
    }

    // 保持对话历史在合理长度内（避免超出 token 限制）
    const maxHistoryLength = this.getMaxHistoryLength(model);
    if (updatedHistory.length > maxHistoryLength) {
      // 保留系统消息，删除最早的对话
      const systemMessages = updatedHistory.filter((msg) => msg.role === 'system');
      const conversationMessages = updatedHistory.filter((msg) => msg.role !== 'system');
      const trimmedConversation = conversationMessages.slice(-maxHistoryLength + systemMessages.length);
      updatedHistory.splice(0, updatedHistory.length, ...systemMessages, ...trimmedConversation);
    }

    return {
      response,
      updatedHistory,
    };
  }

  /**
   * 根据模型获取最大历史长度
   */
  private getMaxHistoryLength(model: string): number {
    switch (model) {
      case 'moonshot-v1-8k':
        return 20; // 约 8k tokens 支持 20 轮对话
      case 'moonshot-v1-32k':
        return 60; // 约 32k tokens 支持 60 轮对话
      case 'moonshot-v1-128k':
        return 200; // 约 128k tokens 支持 200 轮对话
      case 'kimi-k2-turbo-preview':
      case 'kimi-k2.5':
      case 'kimi-k2.5-turbo-preview':
      case 'kimi-k2.5-pro-preview':
        return 100; // Kimi K2 系列模型默认 100 轮对话
      default:
        return 20;
    }
  }

  /**
   * 获取可用的 Kimi 模型列表
   */
  getAvailableModels(): string[] {
    return this.validModels;
  }

  /**
   * 估算消息的 token 数量（简单估算）
   */
  estimateTokens(messages: KimiMessage[]): number {
    // 简单估算：中文字符 * 1.5，英文单词 * 1.3
    let totalTokens = 0;

    for (const message of messages) {
      const content = message.content;
      const chineseChars = (content.match(/[\u4e00-\u9fff]/g) || []).length;
      const englishWords = (content.match(/[a-zA-Z]+/g) || []).length;
      const otherChars = content.length - chineseChars - englishWords;

      totalTokens += Math.ceil(chineseChars * 1.5 + englishWords * 1.3 + otherChars * 0.5);
    }

    return totalTokens;
  }

  private buildImageDataUrl(imageBase64: string, imageMimeType?: string): string {
    const trimmed = imageBase64.trim();
    if (trimmed.startsWith('data:image/')) {
      return trimmed;
    }
    const mimeType = imageMimeType?.trim() || 'image/png';
    return `data:${mimeType};base64,${trimmed}`;
  }

  private async fetchImageAsBase64(imageUrl: string): Promise<{
    imageBase64: string;
    imageMimeType: string;
  }> {
    try {
      const parsedUrl = new URL(imageUrl);
      if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
        throw new HttpException('imageUrl must start with http:// or https://', 400);
      }
    } catch {
      throw new HttpException('imageUrl is invalid', 400);
    }

    try {
      const response = await firstValueFrom(
        this.httpService.get<ArrayBuffer>(imageUrl, {
          responseType: 'arraybuffer',
          timeout: Number(this.configService.get<string>('KIMI_TIMEOUT_MS') ?? 60000),
        }),
      );

      const contentTypeHeader = response.headers['content-type'];
      const imageMimeType = Array.isArray(contentTypeHeader)
        ? contentTypeHeader[0]
        : contentTypeHeader || 'image/png';

      if (!imageMimeType.startsWith('image/')) {
        throw new HttpException('imageUrl content-type is not an image', 400);
      }

      const imageBuffer = Buffer.from(response.data);
      const imageBase64 = imageBuffer.toString('base64');
      return { imageBase64, imageMimeType };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      const axiosError = error as AxiosError;
      const statusCode = axiosError.response?.status ?? 502;
      const responseBody = axiosError.response?.data ?? {
        message: 'Fetch imageUrl failed.',
      };
      throw new HttpException(responseBody, statusCode);
    }
  }

  private resolveTemperature(model: string, inputTemperature?: number): number {
    // kimi-k2.5 当前仅支持 temperature=1
    if (model === 'kimi-k2.5') {
      return 1;
    }
    return inputTemperature ?? 0.3;
  }

  private resolveTopP(model: string, inputTopP?: number): number {
    // kimi-k2.5 当前仅支持 top_p=0.95
    if (model === 'kimi-k2.5') {
      return 0.95;
    }
    return inputTopP ?? 1;
  }
}
