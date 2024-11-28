import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { resolve } from 'node:path';
import { JwtModule } from '@nestjs/jwt';
import { UserModule } from './user/user.module';
@Module({
  imports: [
    AuthModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: resolve('./config/.env'),
    }),
    MongooseModule.forRootAsync({
      useFactory: (config: ConfigService) => {
        return {
          uri: config.get<string>('DB_CLOUD_URL'),
        };
      },
      inject: [ConfigService],
    }),
    {
      module: JwtModule,
      global: true,
    },
    UserModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
