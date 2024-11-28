import { Body, Controller, Post, UseFilters } from '@nestjs/common';
import { AuthService } from './auth.service';
import { authForOptions } from 'src/utils/Constants/user.constants';
import { UnHandledExceptions } from 'src/filters/unhandeldErrors.filter';

@Controller('auth')
@UseFilters(UnHandledExceptions)
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

  // @Post('verifyOTP')
  // verifyOTP(
  //   @Body('otp') otp: string,
  //   @Body('token') token: string,
  //   @Body('type') type: authForOptions,
  // ) {
  //   return this.authService.verifyOTP(type, token, otp);
  // }

  @Post('/preForgetPassword')
  preForgetPassword(@Body('email') email: string) {
    return this.authService.preForgetPassword(email);
  }

  @Post('/forgetPassword')
  forgetPassword(
    @Body('token') token: string,
    @Body('password') password: string,
    @Body('otp') otp: string,
  ) {
    return this.authService.forgetPassword(token, password, otp);
  }
}
