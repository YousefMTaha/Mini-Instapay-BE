import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { AuthGuard } from 'src/guards/auth.guard';
import { currentUser } from 'src/decorators/current-user.decortaor';
import { userType } from 'src/schemas/user.schema';
import { AuthorizationGuard } from 'src/guards/Authorization.guard';
import { userRoles } from 'src/utils/Constants/user.constants';
import { Types } from 'mongoose';
import { AuthService } from 'src/modules/auth/auth.service';
import { OTPDTO } from 'src/utils/common/common.dto';
import { verifyEmailDTO } from '../auth/dto/verify-email.dto';

// useFilte(UnHandledExceptions)
@UseGuards(AuthGuard)
@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
  ) {}

  @Get()
  getUser(@currentUser() user: userType) {
    return this.userService.getUser(user);
  }

  @Patch()
  updateUser(@currentUser() user: userType, @Body() body: any) {
    return this.userService.updateUser(user, body);
  }

  @Patch('updatePassword')
  updatePassword(@currentUser() userData: userType, @Body() body: any) {
    return this.userService.updatePassword(userData, body);
  }

  @Post('changeEmail')
  updateEmail(@Body('email') email: string, @currentUser() user: userType) {
    return this.authService.changeMail(user, email);
  }

  @Patch('confirmChangeEmail')
  confirmChangeEmail(@Body() body: verifyEmailDTO) {
    return this.authService.confirmUpdateMail(body.token, body.otp);
  }

  @Post('logout')
  logout(@currentUser() user: userType) {
    return this.userService.logout(user);
  }

  // admin

  @UseGuards(new AuthorizationGuard(userRoles.Admin))
  @Get('admin')
  getAllusers() {
    return this.userService.getAll();
  }

  @UseGuards(new AuthorizationGuard(userRoles.Admin))
  @Post('admin/banned')
  bannedUser(@Body('userId') userId: Types.ObjectId) {
    return this.userService.bannedUser(userId);
  }
}
