import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AiModule } from './ai/ai.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const rawHost = configService.get<string>('MYSQL_HOST', '127.0.0.1');
        const normalizedHost = rawHost.replace(/^https?:\/\//, '').replace(/^mysql:\/\//, '');

        return {
          type: 'mysql',
          host: normalizedHost,
          port: Number(configService.get<string>('MYSQL_PORT', '3306')),
          username: configService.get<string>('MYSQL_USER'),
          password: configService.get<string>('MYSQL_PASSWORD'),
          database: configService.get<string>('MYSQL_DATABASE'),
          autoLoadEntities: true,
          synchronize: configService.get<string>('MYSQL_SYNCHRONIZE', 'false') === 'true',
        };
      },
    }),
    AiModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
