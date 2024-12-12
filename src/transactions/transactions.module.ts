import { Module } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import transactionModel from 'src/schemas/transaction.schema';
import accountModel from 'src/schemas/account.schema';
import { userModel } from 'src/schemas/user.schema';
import { AccountService } from 'src/account/account.service';
import { UserModule } from 'src/user/user.module';
import { NotificationModule } from 'src/notification/notification.module';

@Module({
  imports: [
    accountModel,
    transactionModel,
    UserModule,
    userModel,
    NotificationModule,
  ],
  controllers: [TransactionsController],
  providers: [TransactionsService, AccountService],
})
export class TransactionsModule {}
