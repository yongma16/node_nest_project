import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes, scrypt, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import { Repository } from 'typeorm';
import { AiChatRecord } from './ai-chat-record.entity';
import { AiUser } from './ai-user.entity';
import { CreateChatRecordDto } from './dto/create-chat-record.dto';
import { GetChatHistoryDto } from './dto/get-chat-history.dto';
import { GetRecentSessionsDto } from './dto/get-recent-sessions.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { RegisterUserDto } from './dto/register-user.dto';

const scryptAsync = promisify(scrypt);

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(AiUser)
    private readonly aiUserRepository: Repository<AiUser>,
    @InjectRepository(AiChatRecord)
    private readonly aiChatRecordRepository: Repository<AiChatRecord>,
  ) {}

  async register(dto: RegisterUserDto): Promise<{
    id: number;
    name: string;
    email: string;
    createdAt: Date;
  }> {
    if (!dto.name?.trim() || !dto.email?.trim() || !dto.password?.trim()) {
      throw new BadRequestException('name, email, password are required');
    }

    const exists = await this.aiUserRepository.findOne({
      where: { email: dto.email.trim().toLowerCase() },
    });
    if (exists) {
      throw new ConflictException('email already exists');
    }

    const passwordHash = await this.hashPassword(dto.password);
    const entity = this.aiUserRepository.create({
      name: dto.name.trim(),
      email: dto.email.trim().toLowerCase(),
      password: passwordHash,
    });
    const saved = await this.aiUserRepository.save(entity);

    return {
      id: saved.id,
      name: saved.name,
      email: saved.email,
      createdAt: saved.createdAt,
    };
  }

  /**
   * 校验邮箱与密码，成功时更新 lastLoginAt 并返回用户信息，失败返回 null。
   * 供 AuthService 登录并签发 JWT 使用。
   */
  async validateUser(
    email: string,
    password: string,
  ): Promise<{
    id: number;
    name: string;
    email: string;
    createdAt: Date;
    lastLoginAt: Date | null;
  } | null> {
    if (!email?.trim() || !password?.trim()) {
      return null;
    }

    const user = await this.aiUserRepository.findOne({
      where: { email: email.trim().toLowerCase() },
    });
    if (!user) {
      return null;
    }

    const isValid = await this.verifyPassword(password, user.password);
    if (!isValid) {
      return null;
    }

    user.lastLoginAt = new Date();
    const saved = await this.aiUserRepository.save(user);
    return {
      id: saved.id,
      name: saved.name,
      email: saved.email,
      createdAt: saved.createdAt,
      lastLoginAt: saved.lastLoginAt,
    };
  }

  async login(dto: LoginUserDto): Promise<{
    id: number;
    name: string;
    email: string;
    createdAt: Date;
    lastLoginAt: Date | null;
  }> {
    if (!dto.email?.trim() || !dto.password?.trim()) {
      throw new BadRequestException('email and password are required');
    }

    const user = await this.validateUser(dto.email, dto.password);
    if (!user) {
      throw new UnauthorizedException('invalid email or password');
    }

    return user;
  }

  async createChatRecord(dto: CreateChatRecordDto): Promise<{
    id: number;
    userId: number;
    sessionId: string;
    createdAt: Date;
  }> {
    if (
      !dto.userId ||
      !dto.sessionId?.trim() ||
      !dto.userQueryContent?.trim() ||
      !dto.aiReplyContent?.trim() ||
      !dto.aiModelType?.trim()
    ) {
      throw new BadRequestException(
        'userId, sessionId, userQueryContent, aiReplyContent, aiModelType are required',
      );
    }

    const responseTimeMs = Number(dto.responseTimeMs);
    if (!Number.isFinite(responseTimeMs) || responseTimeMs < 0) {
      throw new BadRequestException('responseTimeMs must be a non-negative number');
    }

    const record = this.aiChatRecordRepository.create({
      userId: dto.userId,
      sessionId: dto.sessionId.trim(),
      userQueryContent: dto.userQueryContent.trim(),
      aiReplyContent: dto.aiReplyContent.trim(),
      aiModelType: dto.aiModelType.trim(),
      responseTimeMs: Math.round(responseTimeMs),
    });
    const saved = await this.aiChatRecordRepository.save(record);

    return {
      id: saved.id,
      userId: saved.userId,
      sessionId: saved.sessionId,
      createdAt: saved.createdAt,
    };
  }

  async getSessionChatHistory(dto: GetChatHistoryDto): Promise<{
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    items: Array<{
      id: number;
      userId: number;
      sessionId: string;
      userQueryContent: string;
      aiReplyContent: string;
      aiModelType: string;
      responseTimeMs: number;
      createdAt: Date;
    }>;
  }> {
    const userId = Number(dto.userId);
    const sessionId = dto.sessionId?.trim();
    const page = Math.max(1, Number(dto.page ?? 1));
    const pageSize = Math.min(100, Math.max(1, Number(dto.pageSize ?? 20)));

    if (!Number.isInteger(userId) || userId <= 0) {
      throw new BadRequestException('userId must be a positive integer');
    }
    if (!sessionId) {
      throw new BadRequestException('sessionId is required');
    }

    const [items, total] = await this.aiChatRecordRepository.findAndCount({
      where: { userId, sessionId },
      order: { createdAt: 'ASC', id: 'ASC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
      items: items.map((item) => ({
        id: item.id,
        userId: item.userId,
        sessionId: item.sessionId,
        userQueryContent: item.userQueryContent,
        aiReplyContent: item.aiReplyContent,
        aiModelType: item.aiModelType,
        responseTimeMs: item.responseTimeMs,
        createdAt: item.createdAt,
      })),
    };
  }

  async getRecentSessions(dto: GetRecentSessionsDto): Promise<{
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    items: Array<{
      sessionId: string;
      lastUserQueryContent: string;
      lastAiReplyContent: string;
      lastAiModelType: string;
      lastResponseTimeMs: number;
      lastUpdatedAt: Date;
    }>;
  }> {
    const userId = Number(dto.userId);
    const page = Math.max(1, Number(dto.page ?? 1));
    const pageSize = Math.min(100, Math.max(1, Number(dto.pageSize ?? 20)));

    if (!Number.isInteger(userId) || userId <= 0) {
      throw new BadRequestException('userId must be a positive integer');
    }

    const totalRaw = await this.aiChatRecordRepository
      .createQueryBuilder('record')
      .select('COUNT(DISTINCT record.sessionId)', 'total')
      .where('record.userId = :userId', { userId })
      .getRawOne<{ total: string }>();

    const total = Number(totalRaw?.total ?? 0);
    if (total === 0) {
      return {
        page,
        pageSize,
        total: 0,
        totalPages: 0,
        items: [],
      };
    }

    const latestIdSubQuery = this.aiChatRecordRepository
      .createQueryBuilder('sub')
      .select('MAX(sub.id)', 'id')
      .where('sub.userId = :userId', { userId })
      .groupBy('sub.sessionId');

    const latestRecords = await this.aiChatRecordRepository
      .createQueryBuilder('record')
      .where(`record.id IN (${latestIdSubQuery.getQuery()})`)
      .setParameters(latestIdSubQuery.getParameters())
      .orderBy('record.createdAt', 'DESC')
      .addOrderBy('record.id', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getMany();

    return {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
      items: latestRecords.map((item) => ({
        sessionId: item.sessionId,
        lastUserQueryContent: item.userQueryContent,
        lastAiReplyContent: item.aiReplyContent,
        lastAiModelType: item.aiModelType,
        lastResponseTimeMs: item.responseTimeMs,
        lastUpdatedAt: item.createdAt,
      })),
    };
  }

  private async hashPassword(plainText: string): Promise<string> {
    const salt = randomBytes(16).toString('hex');
    const hash = (await scryptAsync(plainText, salt, 64)) as Buffer;
    return `${salt}:${hash.toString('hex')}`;
  }

  private async verifyPassword(plainText: string, storedHash: string): Promise<boolean> {
    const [salt, hashHex] = storedHash.split(':');
    if (!salt || !hashHex) {
      return false;
    }

    const originalHash = Buffer.from(hashHex, 'hex');
    const currentHash = (await scryptAsync(plainText, salt, 64)) as Buffer;
    if (originalHash.length !== currentHash.length) {
      return false;
    }
    return timingSafeEqual(originalHash, currentHash);
  }
}
