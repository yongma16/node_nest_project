import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateChatRecordDto } from './dto/create-chat-record.dto';
import { GetChatHistoryDto } from './dto/get-chat-history.dto';
import { GetRecentSessionsDto } from './dto/get-recent-sessions.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { UsersService } from './users.service';

@ApiTags('Users')
@Controller('v1/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register')
  @ApiOperation({ summary: '用户注册' })
  @ApiResponse({ status: 201, description: '注册成功' })
  async register(@Body() body: RegisterUserDto): Promise<{
    id: number;
    name: string;
    email: string;
    createdAt: Date;
  }> {
    return this.usersService.register(body);
  }

  @Post('login')
  @ApiOperation({ summary: '用户登录' })
  @ApiResponse({ status: 201, description: '登录成功' })
  async login(@Body() body: LoginUserDto): Promise<{
    id: number;
    name: string;
    email: string;
    createdAt: Date;
    lastLoginAt: Date | null;
  }> {
    return this.usersService.login(body);
  }

  @Post('chat-records')
  @ApiOperation({ summary: '新增用户 AI 对话记录' })
  @ApiResponse({ status: 201, description: '新增成功' })
  async createChatRecord(@Body() body: CreateChatRecordDto): Promise<{
    id: number;
    userId: number;
    sessionId: string;
    createdAt: Date;
  }> {
    return this.usersService.createChatRecord(body);
  }

  @Get('chat-records/history')
  @ApiOperation({ summary: '按 userId + sessionId 查询会话历史（分页）' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getSessionChatHistory(@Query() query: GetChatHistoryDto): Promise<{
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
    return this.usersService.getSessionChatHistory(query);
  }

  @Get('chat-records/sessions')
  @ApiOperation({ summary: '按用户查询最近会话列表（分页）' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getRecentSessions(@Query() query: GetRecentSessionsDto): Promise<{
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
    return this.usersService.getRecentSessions(query);
  }
}
