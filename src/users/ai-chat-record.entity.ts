import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * AI 对话记录：每行为一轮「用户提问 + AI 回复」。
 * 通过 userId + sessionId 可查询同一会话的多轮记录，用于多轮对话的 history 组装与展示。
 */
@Entity('ai_chat_record')
@Index('idx_ai_chat_record_user_session', ['userId', 'sessionId'])
export class AiChatRecord {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index()
  @Column()
  userId!: number;

  /** 会话 ID，与 userId 联合使用可查该会话下所有轮次，供多轮对话 history 查询 */
  @Index()
  @Column({ length: 120 })
  sessionId!: string;

  @Column({ type: 'text' })
  userQueryContent!: string;

  @Column({ type: 'text' })
  aiReplyContent!: string;

  @Column({ length: 60 })
  aiModelType!: string;

  @Column({ type: 'int', unsigned: true })
  responseTimeMs!: number;

  @CreateDateColumn()
  createdAt!: Date;
}
