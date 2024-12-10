import {
  Body,
  Controller,
  Get,
  Post,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { currentUser } from 'src/decorators/current-user.decortaor';
import { UnHandledExceptions } from 'src/filters/unhandeldErrors.filter';
import { AuthGuard } from 'src/guards/auth.guard';
import { userType } from 'src/schemas/user.schema';
import { UserService } from 'src/user/user.service';
import { AccountService } from 'src/account/account.service';
import { accountType } from 'src/schemas/account.schema';
import { EaccountType } from 'src/utils/Constants/system.constants';

@UseFilters(UnHandledExceptions)
@UseGuards(AuthGuard)
@Controller('transaction')
export class TransactionsController {
  constructor(
    private readonly transactionsService: TransactionsService,
    private readonly accountService: AccountService,
    private readonly userService: UserService,
  ) {}

  @Post('/send-money')
  async sendMoney(@currentUser() user: userType, @Body() body: any) {
    let senderAccount: accountType;
    if (body.accountId) {
      senderAccount = await this.accountService.getAccountById(
        user._id,
        body.accountId,
        EaccountType.OWNER,
      );
    } else {
      senderAccount = await this.accountService.checkDefaultAcc(
        user,
        EaccountType.OWNER,
      );
    }

    senderAccount.checkAmount(body.amount);

    const receiver = await this.userService.findUser({ email: body.email });

    const receiveAccount = await this.accountService.checkDefaultAcc(
      receiver,
      EaccountType.RECEIVER,
    );

    return this.transactionsService.sendMoney(
      senderAccount,
      receiveAccount,
      body.amount,
    );
  }

  @Get('/history')
  getHistory(@currentUser() user: userType) {
    return this.transactionsService.getHistory(user);
  }
}
