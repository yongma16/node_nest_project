import { HttpService } from '@nestjs/axios';
import { HttpException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';
import { ChatCompletionRequestDto } from './dto/chat-completion.dto';

@Injectable()
export class AiService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async proxyChatCompletion(payload: ChatCompletionRequestDto): Promise<unknown> {
    const baseUrl = this.configService.get<string>('AI_BASE_URL') ?? 'https://api.openai.com/v1';
    const apiKey = this.configService.get<string>('AI_API_KEY');
    const defaultModel = this.configService.get<string>('AI_MODEL') ?? 'gpt-4o-mini';
    const timeoutMs = Number(this.configService.get<string>('AI_TIMEOUT_MS') ?? 60000);

    if (!apiKey) {
      throw new InternalServerErrorException(
        'Missing AI_API_KEY. Please set it in your environment variables.',
      );
    }

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${baseUrl.replace(/\/+$/, '')}/chat/completions`,
          {
            ...payload,
            model: payload.model ?? defaultModel,
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
        message: 'Upstream AI request failed.',
      };

      throw new HttpException(responseBody, statusCode);
    }
  }
}
