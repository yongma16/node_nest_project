import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
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
  console.log(`应用运行在: http://localhost:${port}`);
  console.log(`API 文档: http://localhost:${port}/api`);
}
bootstrap();
bootstrap();
