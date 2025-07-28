import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/schemas/user.schema';
import { userStatus } from 'src/utils/Constants/user.constants';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwtService: JwtService,
    private configService: ConfigService,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (this.reflector.get<boolean>('skipAuth', context.getHandler()))
      return true;

    const request = context.switchToHttp().getRequest();

    const { token } = request.headers;

    if (!token) throw new BadRequestException('login first');

    const { _id } = this.jwtService.verify(token, {
      secret: this.configService.get<string>('TOKEN_LOGIN'),
    });

    const user = await this.userModel.findById(_id, { password: 0 });
    if (!user) throw new NotFoundException('user not found');

    if (user.status == userStatus.Offline) {
      throw new UnauthorizedException('you need to login again');
    }

    if (user.status == userStatus.Suspended) {
      throw new ForbiddenException(
        'Your account has been banned, please contact us',
      );
    }

    request.currentUser = user;

    return true;
  }
}
