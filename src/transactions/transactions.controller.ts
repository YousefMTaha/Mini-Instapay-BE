import { Body, Controller, Post, UseFilters, UseGuards } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { currentUser } from 'src/decorators/current-user.decortaor';
import { UnHandledExceptions } from 'src/filters/unhandeldErrors.filter';
import { AuthGuard } from 'src/guards/auth.guard';
import { userType } from 'src/schemas/user.schema';
import { UserService } from 'src/user/user.service';
import { AccountService } from 'src/account/account.service';

@UseFilters(UnHandledExceptions)
@UseGuards(AuthGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(
    private readonly transactionsService: TransactionsService,
    private readonly accountService: AccountService,
  ) {}

  @Post('/sendMoney')
  async sendMoney(@currentUser() user: userType, @Body() body: any) {
    const senderAccount = await this.accountService.checkUserAccount(user._id);
    const receiveAccount = await this.accountService.checkUserAccount(user._id);

    return this.transactionsService.sendMoney(senderAccount, receiveAccount, body.amount);
  }
}
