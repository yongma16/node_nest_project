import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('ai_chat_record')
@Index('idx_ai_chat_record_user_session', ['userId', 'sessionId'])
export class AiChatRecord {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index()
  @Column()
  userId!: number;

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
