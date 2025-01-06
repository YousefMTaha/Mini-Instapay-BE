import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { resolve } from 'node:path';
import { JwtModule } from '@nestjs/jwt';
import { AccountModule } from './account/account.module';
import { BankModule } from './bank/bank.module';
import { TransactionsModule } from './transactions/transactions.module';
import { NotificationModule } from './notification/notification.module';
import { CardModule } from './card/card.module';
import { RealtimeModule } from './realtime/realtime.module';
import { UserModule } from './user/user.module';
import { ScheduleModule } from '@nestjs/schedule';
import { AppService } from './app.service';
import { AuthGuard } from 'src/guards/auth.guard';
import { LoggerMiddleware } from 'src/middlewares/logger.middleware';
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

          onConnectionCreate(connection) {
            connection.on('connected', () => {
              return console.log(
                `****************** DB CONNECTED ******************`,
              );
            });
            return connection;
          },
        };
      },
      inject: [ConfigService],
    }),
    ScheduleModule.forRoot({ cronJobs: true }),
    {
      module: JwtModule,
      global: true,
    },
    UserModule,
    AccountModule,
    BankModule,
    TransactionsModule,
    NotificationModule,
    CardModule,
    RealtimeModule,
  ],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
