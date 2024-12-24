import { forwardRef, Module } from '@nestjs/common';
import { AccountService } from './account.service';
import { AccountController } from './account.controller';
import { userModel } from 'src/schemas/user.schema';
import accountModel from 'src/schemas/account.schema';
import cardModel from 'src/schemas/card.schema';
import { CardService } from 'src/modules/card/card.service';
import { TransactionsModule } from 'src/modules/transactions/transactions.module';
import { NotificationModule } from 'src/modules/notification/notification.module';
import { AuthModule } from '../auth/auth.module';
import { MailService } from 'src/utils/email.service';

@Module({
  controllers: [AccountController],
  providers: [AccountService, CardService, MailService],
  imports: [
    accountModel,
    userModel,
    cardModel,
    forwardRef(() => TransactionsModule),
    NotificationModule,
    AuthModule,
  ],

  exports: [AccountService, accountModel],
})
export class AccountModule {}
