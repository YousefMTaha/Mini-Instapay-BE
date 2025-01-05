import { Body, Controller, Patch, Post, UseFilters } from '@nestjs/common';
import { AuthService } from './auth.service';
import { authForOptions } from 'src/utils/Constants/user.constants';
import { SignupDTO } from './dto/signup.dto';
import { PreLoginDTO } from './dto/pre-login.dto';
import { EmailDTO, OTPDTO } from 'src/utils/common/common.dto';
import { VerifyEmailDTO } from './dto/verify-email.dto';
import { ResendMailDTO } from './dto/resend-email.dto';
import { LoginDTO } from './dto/login.dto';
import { ConfirmOTPpasswordDTO } from './dto/confirm-otp-password.dto';
import { ForgetPasswordDTO } from './dto/forget-password.dto';
import { UpdateEmailDTO } from './dto/update-email.dto';
import { ConfirmChangeEmailDTO } from './dto/confirm-change-email.dto';

@Controller('auth')
// useFilte(UnHandledExceptions)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  singup(@Body() body: SignupDTO) {
    return this.authService.singup(body);
  }

  @Post('verifyEmail')
  verifyEmail(@Body() body: VerifyEmailDTO) {
    return this.authService.verifyEmail(body.token, body.otp);
  }

  @Post('resendOTP')
  resendOTP(@Body() body: ResendMailDTO) {
    return this.authService.resendOTP(body.type, body.token);
  }

  @Post('preLogin')
  preLogin(@Body() body: PreLoginDTO) {
    return this.authService.prelogin(body);
  }

  @Post('login')
  login(@Body() body: LoginDTO) {
    return this.authService.login(body.token, body.otp);
  }

  @Post('send-forget-password-mail')
  preForgetPassword(@Body() body: EmailDTO) {
    return this.authService.sendForgetPassOTP(body.email);
  }

  @Post('confirm-otp-forget')
  confirmOTPpassword(@Body() body: ConfirmOTPpasswordDTO) {
    return this.authService.confirmOTPpassword(body.token, body.otp);
  }

  @Post('forget-password')
  forgetPassword(@Body() body: ForgetPasswordDTO) {
    return this.authService.forgetPass(body.token, body.password);
  }

  @Post('changeEmail')
  updateEmail(@Body() body: UpdateEmailDTO) {
    return this.authService.changeMail(body.token, body.email);
  }

  @Patch('confirmChangeEmail')
  confirmChangeEmail(@Body() body: ConfirmChangeEmailDTO) {
    return this.authService.confirmUpdateMail(body.token, body.otp);
  }
}
