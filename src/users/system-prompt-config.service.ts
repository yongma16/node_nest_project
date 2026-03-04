import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemPromptConfig } from './system-prompt-config.entity';

export interface SystemPromptConfigDto {
  id: number;
  type: string;
  name: string;
  systemPrompt: string;
  userPrompt: string | null;
  sortOrder: number;
}

@Injectable()
export class SystemPromptConfigService {
  constructor(
    @InjectRepository(SystemPromptConfig)
    private readonly repo: Repository<SystemPromptConfig>,
  ) {}

  /** 按 sortOrder 排序返回所有配置，用于前端「模型方向」选择 */
  async findAll(): Promise<SystemPromptConfigDto[]> {
    const list = await this.repo.find({
      order: { sortOrder: 'ASC', id: 'ASC' },
    });
    return list.map((row) => ({
      id: row.id,
      type: row.type,
      name: row.name,
      systemPrompt: row.systemPrompt,
      userPrompt: row.userPrompt,
      sortOrder: row.sortOrder,
    }));
  }

  /** 按类型查询单条，用于对话时注入 systemPrompt */
  async findByType(type: string): Promise<SystemPromptConfigDto | null> {
    const row = await this.repo.findOne({
      where: { type: type.trim() },
    });
    if (!row) return null;
    return {
      id: row.id,
      type: row.type,
      name: row.name,
      systemPrompt: row.systemPrompt,
      userPrompt: row.userPrompt,
      sortOrder: row.sortOrder,
    };
  }

  /** 按 id 查询 */
  async findById(id: number): Promise<SystemPromptConfigDto | null> {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) return null;
    return {
      id: row.id,
      type: row.type,
      name: row.name,
      systemPrompt: row.systemPrompt,
      userPrompt: row.userPrompt,
      sortOrder: row.sortOrder,
    };
  }
}
