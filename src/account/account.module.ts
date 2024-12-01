import { Module } from '@nestjs/common';
import { AccountService } from './account.service';
import { AccountController } from './account.controller';
import { userModel } from 'src/schemas/user.schema';
import accountModel from 'src/schemas/account.schema';

@Module({
  controllers: [AccountController],
  providers: [AccountService],
  imports: [accountModel, userModel],
})
export class AccountModule {}
