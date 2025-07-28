import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { AuthGuard } from 'src/guards/auth.guard';
import { currentUser } from 'src/decorators/current-user.decorator';
import { userType } from 'src/schemas/user.schema';
import { AuthorizationGuard } from 'src/guards/Authorization.guard';
import { userRoles } from 'src/utils/Constants/user.constants';
import { AuthService } from 'src/modules/auth/auth.service';
import { UpdateUserDTO } from './dto/update-user.dto';
import { UpdatePasswordDTO } from './dto/update-password.dto';
import { EmailDTO } from 'src/utils/common/common.dto';
import { ConfirmChangeEmailDTO } from '../auth/dto/confirm-change-email.dto';
import { BannedUserDTO } from './dto/banned-user.dto';

@UseGuards(AuthGuard)
@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
  ) {}

  /**
   * Get user data
   */
  @Get()
  getUser(@currentUser() user: userType) {
    return this.userService.getUser(user);
  }

  /**
   * Update user data
   */
  @Patch()
  updateUser(@currentUser() user: userType, @Body() body: UpdateUserDTO) {
    return this.userService.updateUser(user, body);
  }

  /**
   * Change user password
   */
  @Patch('updatePassword')
  updatePassword(
    @currentUser() userData: userType,
    @Body() body: UpdatePasswordDTO,
  ) {
    return this.userService.updatePassword(userData, body);
  }

  /**
   * Update user email
   */
  @Post('changeEmail')
  updateEmail(@Body() body: EmailDTO, @currentUser() user: userType) {
    return this.authService.changeMail(user, body.email);
  }

  /**
   * Confirm change email
   */
  @Patch('confirmChangeEmail')
  confirmChangeEmail(@Body() body: ConfirmChangeEmailDTO) {
    return this.authService.confirmUpdateMail(body.token, body.otp);
  }

  /**
   * Logout user
   */
  @Post('logout')
  logout(@currentUser() user: userType) {
    return this.userService.logout(user);
  }

  // admin

  /**
   * Get all users
   */
  @UseGuards(new AuthorizationGuard(userRoles.Admin))
  @Get('admin')
  getAllusers() {
    return this.userService.getAll();
  }

  /**
   * Banned user
   */
  @UseGuards(new AuthorizationGuard(userRoles.Admin))
  @Post('admin/banned')
  bannedUser(@Body() body: BannedUserDTO) {
    return this.userService.bannedUser(body.userId);
  }
}
