import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { resolve } from 'node:path';
import { JwtModule } from '@nestjs/jwt';
import { UserModule } from './user/user.module';
import { AccountModule } from './account/account.module';
import { BankModule } from './bank/bank.module';
import { TransactionsModule } from './transactions/transactions.module';
import { NotificationModule } from './notification/notification.module';
import { CardModule } from './card/card.module';
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
              return console.log(`****************** DB CONNECTED ******************`);
            });
            return connection;
          },
        };
      },
      inject: [ConfigService],
    }),
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
