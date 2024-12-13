import { Body, Controller, Patch, Post, UseFilters } from '@nestjs/common';
import { AuthService } from './auth.service';
import { authForOptions } from 'src/utils/Constants/user.constants';
import { UnHandledExceptions } from 'src/filters/unhandeldErrors.filter';

@Controller('auth')
// useFilte(UnHandledExceptions)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  singup(@Body() body: any) {
    return this.authService.singup(body);
  }

  @Post('verifyEmail')
  verifyEmail(@Body('token') token: string, @Body('otp') otp: string) {
    return this.authService.verifyEmail(token, otp);
  }

  @Post('resendOTP')
  resendOTP(@Body('token') token: string, @Body('type') type: authForOptions) {
    return this.authService.resendOTP(type, token);
  }

  @Post('preLogin')
  preLogin(@Body() body: any) {
    return this.authService.prelogin(body);
  }

  @Post('login')
  login(@Body('token') token: string, @Body('otp') otp: string) {
    return this.authService.login(token, otp);
  }

  @Post('send-forget-password-mail')
  preForgetPassword(@Body('email') email: string) {
    return this.authService.sendForgetPassOTP(email);
  }

  @Post('confirm-otp-forget')
  confirmOTPpassword(@Body('token') token: string, @Body('otp') otp: string) {
    return this.authService.confirmOTPpassword(token, otp);
  }

  @Post('forget-password')
  forgetPassword(
    @Body('token') token: string,
    @Body('password') password: string,
  ) {
    return this.authService.forgetPass(token, password);
  }

  @Post('changeEmail')
  updateEmail(@Body('email') email: string, @Body('token') token: string) {
    return this.authService.changeMail(token, email);
  }

  @Patch('confirmChangeEmail')
  confirmChangeEmail(@Body('token') token: string, @Body('otp') otp: string) {
    return this.authService.confirmUpdateMail(token, otp);
  }
}
