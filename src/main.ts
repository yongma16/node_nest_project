import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
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
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const server = await app.listen(0);
  const port = server.address().port;
  logger.log(`应用运行在: http://localhost:${port}`);
  logger.log(`API 文档: http://localhost:${port}/api`);
}
bootstrap();
