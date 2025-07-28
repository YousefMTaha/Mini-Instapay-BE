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
import { currentUser } from 'src/decorators/current-user.decorator';
import { userType } from 'src/schemas/user.schema';
import { AuthGuard } from 'src/guards/auth.guard';
import { CardService } from 'src/modules/card/card.service';
import { EAccountType } from 'src/utils/Constants/system.constants';
import {
  ObjectIdDTO,
  PINDTO,
  TokenAndOTPDTO,
  TokenDTO,
} from 'src/utils/common/common.dto';
import { AddAccountDTO } from './dto/add-account.dto';
import { UpdateLimitDTO } from './dto/update-amount.dto';
import { UpdatePinDTO } from './dto/update-PIN.dto';
import { ForgetPinDTO } from './dto/forget-PIN.dto';

@UseGuards(AuthGuard)
@Controller('account')
export class AccountController {
  constructor(
    private readonly accountService: AccountService,
    private readonly cardService: CardService,
  ) {}

  /**
   * Get all accounts for the current user.
   * Data from current user is passed as an argument.
   */
  @Get()
  getAllAccounts(@currentUser() user: userType) {
    return this.accountService.getAllAccounts(user);
  }

  /**
   * Get the default account for the current user.
   * Data from current user is passed as an argument.
   */
  @Get('defaultAcc')
  getDefault(@currentUser() user: userType) {
    return this.accountService.getDefault(user);
  }

  /**
   * Reset the number of tries for PIN verification.
   * The token is passed from the URL parameters.
   */
  @Get('verifyAccountUser/:token')
  @SetMetadata('skipAuth', true) // Don't apply AuthGuard on this API
  resetTries(@Param() param: TokenDTO) {
    return this.accountService.resetTries(param.token);
  }

  /**
   * Get the balance of a specific account.
   * Requires accountId from URL parameters and PIN from request body.
   */
  @Post('balance/:id')
  async getBalance(
    @currentUser() user: userType,
    @Param() param: ObjectIdDTO,
    @Body() body: PINDTO,
  ) {
    const account = await this.accountService.getAccount(param.id);
    await this.accountService.checkPIN(user, account, body.PIN);
    return {
      message: 'done',
      status: true,
      data: account.Balance,
    };
  }

  /**
   * Add a new account for the current user.
   * Requires card information and user details from request body and current user.
   */
  @Post()
  async add(@Body() body: AddAccountDTO, @currentUser() user: userType) {
    await this.cardService.checkCardExist(body.cardNo);
    const card = await this.cardService.addCard(body);
    return this.accountService.addAccount(body, user, card.data);
  }

  /**
   * Update the limit of a specific account.
   * Requires accountId from URL parameters and limit details from request body.
   */
  @Patch('limit/:id')
  async updateLimit(
    @currentUser() user: userType,
    @Body() body: UpdateLimitDTO,
    @Param() param: ObjectIdDTO,
  ) {
    const account = await this.accountService.getAccountById(
      user._id,
      param.id,
      EAccountType.OWNER,
    );
    return this.accountService.updateLimit(account, body);
  }

  /**
   * Update the PIN of a specific account.
   * Requires accountId from URL parameters and old/new PINs from request body.
   */
  @Patch('PIN/:id')
  async updatePIN(
    @Body() body: UpdatePinDTO,
    @Param() param: ObjectIdDTO,
    @currentUser() user: userType,
  ) {
    const account = await this.accountService.getAccountById(
      user._id,
      param.id,
      EAccountType.OWNER,
    );
    await this.accountService.checkPIN(user, account, body.oldPIN);
    return this.accountService.updatePIN(body, account);
  }

  /**
   * Delete a specific account.
   * Requires accountId from URL parameters and PIN from request body.
   */
  @Delete(':id')
  async delete(
    @Body() body: PINDTO,
    @currentUser() user: userType,
    @Param() param: ObjectIdDTO,
  ) {
    const account = await this.accountService.getAccount(param.id);
    await this.accountService.checkPIN(user, account, body.PIN);
    return this.accountService.deleteAccount(user, account);
  }

  /**
   * Send OTP for forgetting PIN.
   * Requires accountId from URL parameters.
   */
  @Post('sendForgetPINOTP/:id')
  async sendOTP(@currentUser() user: userType, @Param() param: ObjectIdDTO) {
    const account = await this.accountService.getAccountById(
      user._id,
      param.id,
      EAccountType.OWNER,
    );
    return this.accountService.forgetOTPMail(user, account);
  }

  /**
   * Confirm OTP for forgetting PIN.
   * Requires token and OTP from request body.
   */
  @Post('confirmOTPforgetPIN')
  async confirmOTPForgetPIN(
    @currentUser() user: userType,
    @Body() body: TokenAndOTPDTO,
  ) {
    return this.accountService.confirmOTPForgetPIN(body.token, user, body.otp);
  }

  /**
   * Forget PIN and set a new one.
   * Requires token and new PIN from request body.
   */
  @Patch('forgetPIN')
  async forgetPIN(@currentUser() user: userType, @Body() body: ForgetPinDTO) {
    return this.accountService.forgetPIN(user, body.token, body.PIN);
  }
}
