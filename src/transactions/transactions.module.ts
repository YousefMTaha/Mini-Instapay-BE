import { Module } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import transactionModel from 'src/schemas/transaction.schema';
import accountModel from 'src/schemas/account.schema';
import { userModel } from 'src/schemas/user.schema';
import { AccountService } from 'src/account/account.service';

@Module({
  controllers: [TransactionsController],
  providers: [TransactionsService, AccountService],
  imports: [accountModel, transactionModel, userModel],
})
export class TransactionsModule {}
