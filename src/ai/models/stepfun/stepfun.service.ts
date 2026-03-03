import { HttpService } from '@nestjs/axios';
import { HttpException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';
import { StepfunChatRequestDto } from './dto/stepfun-chat.dto';

@Injectable()
export class StepfunService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async chatCompletion(payload: StepfunChatRequestDto): Promise<unknown> {
    const baseUrl = this.configService.get<string>('STEP_BASE_URL') ?? 'https://api.stepfun.com/v1';
    const apiKey = this.configService.get<string>('STEP_API_KEY');
    const defaultModel = this.configService.get<string>('STEP_MODEL') ?? 'step-1-8k';
    const timeoutMs = Number(this.configService.get<string>('STEP_TIMEOUT_MS') ?? 60000);

    if (!apiKey) {
      throw new InternalServerErrorException(
        'Missing STEP_API_KEY. Please set it in your environment variables.',
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
        message: 'StepFun API request failed.',
      };

      throw new HttpException(responseBody, statusCode);
    }
  }
}
