import { HttpService } from '@nestjs/axios';
import { HttpException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosError } from 'axios';
import FormData from 'form-data';
import { firstValueFrom } from 'rxjs';
import { StepfunChatRequestDto } from './dto/stepfun-chat.dto';
import { StepfunImageEditRequestDto } from './dto/stepfun-image-edit.dto';
import { StepfunImageGenerateRequestDto } from './dto/stepfun-image-generate.dto';

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

  async imageEdit(payload: StepfunImageEditRequestDto, imageFile: Express.Multer.File): Promise<unknown> {
    const baseUrl = this.configService.get<string>('STEP_BASE_URL') ?? 'https://api.stepfun.com/v1';
    const apiKey = this.configService.get<string>('STEP_API_KEY');
    const defaultModel = this.configService.get<string>('STEP_IMAGE_EDIT_MODEL') ?? 'step-1x-edit';
    const timeoutMs = Number(this.configService.get<string>('STEP_TIMEOUT_MS') ?? 60000);

    if (!apiKey) {
      throw new InternalServerErrorException(
        'Missing STEP_API_KEY. Please set it in your environment variables.',
      );
    }

    if (!imageFile) {
      throw new HttpException('image file is required', 400);
    }

    if (!payload.prompt?.trim()) {
      throw new HttpException('prompt is required', 400);
    }

    const formData = new FormData();
    const model = payload.model?.trim() || defaultModel;
    formData.append('model', model);
    formData.append('prompt', payload.prompt.trim());
    formData.append('image', imageFile.buffer, {
      filename: imageFile.originalname || 'image',
      contentType: imageFile.mimetype || 'application/octet-stream',
    });

    if (payload.response_format) {
      formData.append('response_format', payload.response_format);
    }

    const cfgScale = this.parseOptionalNumber(payload.cfg_scale, 'cfg_scale');
    if (cfgScale !== undefined) {
      formData.append('cfg_scale', String(cfgScale));
    }

    const steps = this.parseOptionalInteger(payload.steps, 'steps');
    if (steps !== undefined) {
      formData.append('steps', String(steps));
    }

    const seed = this.parseOptionalInteger(payload.seed, 'seed');
    if (seed !== undefined) {
      formData.append('seed', String(seed));
    }

    try {
      const response = await firstValueFrom(
        this.httpService.post(`${baseUrl.replace(/\/+$/, '')}/images/edits`, formData, {
          timeout: timeoutMs,
          headers: {
            Authorization: `Bearer ${apiKey}`,
            ...formData.getHeaders(),
          },
        }),
      );

      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      const statusCode = axiosError.response?.status ?? 502;
      const responseBody = axiosError.response?.data ?? {
        message: 'StepFun image edit request failed.',
      };

      throw new HttpException(responseBody, statusCode);
    }
  }

  async imageGenerate(payload: StepfunImageGenerateRequestDto): Promise<unknown> {
    const baseUrl = this.configService.get<string>('STEP_BASE_URL') ?? 'https://api.stepfun.com/v1';
    const apiKey = this.configService.get<string>('STEP_API_KEY');
    const defaultModel = this.configService.get<string>('STEP_IMAGE_MODEL') ?? 'step-1x-medium';
    const timeoutMs = Number(this.configService.get<string>('STEP_TIMEOUT_MS') ?? 60000);

    if (!apiKey) {
      throw new InternalServerErrorException(
        'Missing STEP_API_KEY. Please set it in your environment variables.',
      );
    }

    if (!payload.prompt?.trim()) {
      throw new HttpException('prompt is required', 400);
    }

    const n = this.parseOptionalInteger(payload.n, 'n');
    const steps = this.parseOptionalInteger(payload.steps, 'steps');
    const seed = this.parseOptionalInteger(payload.seed, 'seed');
    const cfgScale = this.parseOptionalNumber(payload.cfg_scale, 'cfg_scale');

    const extraBody: Record<string, unknown> = { ...(payload.extra_body ?? {}) };
    if (steps !== undefined) {
      extraBody.steps = steps;
    }
    if (seed !== undefined) {
      extraBody.seed = seed;
    }
    if (cfgScale !== undefined) {
      extraBody.cfg_scale = cfgScale;
    }

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${baseUrl.replace(/\/+$/, '')}/images/generations`,
          {
            model: payload.model?.trim() || defaultModel,
            prompt: payload.prompt.trim(),
            response_format: payload.response_format ?? 'url',
            size: payload.size ?? '1024x1024',
            n: n ?? 1,
            ...(Object.keys(extraBody).length > 0 ? { extra_body: extraBody } : {}),
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
        message: 'StepFun image generation request failed.',
      };

      throw new HttpException(responseBody, statusCode);
    }
  }

  private parseOptionalNumber(value: number | string | undefined, field: string): number | undefined {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    const parsed = typeof value === 'number' ? value : Number(value);
    if (Number.isNaN(parsed)) {
      throw new HttpException(`${field} must be a valid number`, 400);
    }
    return parsed;
  }

  private parseOptionalInteger(value: number | string | undefined, field: string): number | undefined {
    const parsed = this.parseOptionalNumber(value, field);
    if (parsed === undefined) {
      return undefined;
    }
    if (!Number.isInteger(parsed)) {
      throw new HttpException(`${field} must be an integer`, 400);
    }
    return parsed;
  }
}
