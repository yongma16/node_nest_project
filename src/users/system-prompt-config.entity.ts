import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * 系统内置的 systemPrompt / userPrompt 配置，按「模型方向」分类。
 * 用于多轮对话时选择不同角色/场景（如技术顾问、创意写作、通用助手等）。
 */
@Entity('system_prompt_config')
@Index('idx_system_prompt_config_type', ['type'])
export class SystemPromptConfig {
  @PrimaryGeneratedColumn()
  id!: number;

  /** 模型方向分类标识，如 technical | creative | general | customer_service */
  @Column({ length: 60 })
  type!: string;

  /** 方向显示名称，便于前端展示 */
  @Column({ length: 120 })
  name!: string;

  /** 系统角色设定，发给模型的 system 消息内容 */
  @Column({ type: 'text' })
  systemPrompt!: string;

  /** 用户侧提示模板或分类说明，可用于引导用户输入或展示方向说明 */
  @Column({ type: 'text', nullable: true })
  userPrompt!: string | null;

  /** 排序权重，数值越小越靠前 */
  @Column({ type: 'int', default: 0 })
  sortOrder!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
