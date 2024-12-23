import { Module } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import transactionModel from 'src/schemas/transaction.schema';
import accountModel from 'src/schemas/account.schema';
import { userModel } from 'src/schemas/user.schema';
import { AccountService } from 'src/modules/account/account.service';
import { UserModule } from 'src/modules/user/user.module';
import { NotificationModule } from 'src/modules/notification/notification.module';
import { MailService } from 'src/utils/email.service';

@Module({
  imports: [
    accountModel,
    transactionModel,
    UserModule,
    userModel,
    NotificationModule,
  ],
  controllers: [TransactionsController],
  providers: [TransactionsService, AccountService, MailService],
  exports: [TransactionsService],
})
export class TransactionsModule {}
