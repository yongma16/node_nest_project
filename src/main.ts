import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });
  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle('AI Proxy Backend')
    .setDescription('AI 代理后端 API')
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'JWT')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const configService = app.get(ConfigService);
  const port = Number(configService.get<string>('PORT', '3000'));
  const host = configService.get<string>('HOST', '0.0.0.0');
  await app.listen(port, host);
  logger.log(`应用运行在: http://localhost:${port}`);
  logger.log(`API 文档: http://localhost:${port}/api`);
}
bootstrap();
