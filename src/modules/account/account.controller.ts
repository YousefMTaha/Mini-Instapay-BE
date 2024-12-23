import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  SetMetadata,
  UseGuards,
} from '@nestjs/common';
import { AccountService } from './account.service';
import { currentUser } from 'src/decorators/current-user.decortaor';
import { userType } from 'src/schemas/user.schema';
import { AuthGuard } from 'src/guards/auth.guard';
import { CardService } from 'src/modules/card/card.service';
import { Types } from 'mongoose';
import { EaccountType } from 'src/utils/Constants/system.constants';

@UseGuards(AuthGuard)
@Controller('account')
// useFilte(UnHandledExceptions)
export class AccountController {
  constructor(
    private readonly accountService: AccountService,
    private readonly cardService: CardService,
  ) {}

  @Get()
  getAllAccounts(@currentUser() user: userType) {
    return this.accountService.getAllAccounts(user);
  }

  @Get('defaultAcc')
  getDefault(@currentUser() user: userType) {
    return this.accountService.getDefault(user);
  }

  @Get('verifyAccountUser/:token')
  @SetMetadata('skipAuth', true)
  resetTries(@Param('token') token: string) {
    return this.accountService.resetTries(token);
  }

  @Post('balance/:accountId')
  async getBalance(
    @currentUser() user: userType,
    @Param('accountId') accountId: Types.ObjectId,
    @Body('PIN') pin: string,
  ) {
    const account = await this.accountService.getAccount(accountId);

    await this.accountService.checkPIN(user, account, pin);

    return {
      message: 'done',
      status: true,
      data: account.Balance,
    };
  }

  @Post()
  async add(@Body() body: any, @currentUser() user: userType) {
    await this.cardService.checkCardExist(body.cardNo);
    const card = await this.cardService.addCard(body);
    return this.accountService.addAccount(body, user, card.data);
  }

  @Patch(':id')
  async update(
    @Body() body: any,
    @Param('id') id: Types.ObjectId,
    @currentUser() user: userType,
  ) {
    const account = await this.accountService.getAccountById(
      user._id,
      id,
      EaccountType.OWNER,
    );
    await this.accountService.checkPIN(user, account, body.oldPIN);
    return this.accountService.updatePIN(body, account);
  }

  @Delete(':id')
  async delete(
    @Body('PIN') pin: string,
    @currentUser() user: userType,
    @Param('id') id: Types.ObjectId,
  ) {
    const account = await this.accountService.getAccount(id);

    await this.accountService.checkPIN(user, account, pin);

    return this.accountService.deleteAccount(user, account);
  }
}
