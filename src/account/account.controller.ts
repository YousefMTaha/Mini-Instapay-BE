import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { AccountService } from './account.service';
import { currentUser } from 'src/decorators/current-user.decortaor';
import { userType } from 'src/schemas/user.schema';
import { AuthGuard } from 'src/guards/auth.guard';
import { UnHandledExceptions } from 'src/filters/unhandeldErrors.filter';

@Controller('account')
@UseGuards(AuthGuard)
@UseFilters(UnHandledExceptions)
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Get()
  getAllAccounts(@currentUser() user: userType) {
    return this.accountService.getAllAccounts(user);
  }

  @Post()
  add(@Body() body: any, @currentUser() user: userType) {
    return this.accountService.addAccount(body, user);
  }

  // @Patch(':id')
  // update(
  //   @Body() body: any,
  //   @currentUser() user: userType,
  //   @Param('id') id: string,
  // ) {
  //   return this.accountService.updatePIN(body, user, id);
  // }

  @Delete(':id')
  async delete(
    @Body('PIN') pin: string,
    @currentUser() user: userType,
    @Param('id') id: string,
  ) {
    const account = await this.accountService.getAccount(id);

    this.accountService.checkPIN(account, pin);

    return this.accountService.deleteAccount(account);
  }
}
