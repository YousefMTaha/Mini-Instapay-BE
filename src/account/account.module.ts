import { Module } from '@nestjs/common';
import { AccountService } from './account.service';
import { AccountController } from './account.controller';
import { userModel } from 'src/schemas/user.schema';
import accountModel from 'src/schemas/account.schema';
import cardModel from 'src/schemas/card.schema';
import { CardService } from 'src/card/card.service';

@Module({
  controllers: [AccountController],
  providers: [AccountService, CardService],
  imports: [accountModel, userModel, cardModel],
})
export class AccountModule {}
