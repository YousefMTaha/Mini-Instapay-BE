import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/schemas/user.schema';
import { userstatus } from 'src/utils/Constants/user.constants';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const { token } = request.headers;

    if (!token) throw new BadRequestException('login first');

    const { _id } = this.jwtService.verify(token, {
      secret: this.configService.get<string>('TOKEN_LOGIN'),
    });

    const user = await this.userModel.findById(_id, { password: -1 });
    if (!user) throw new NotFoundException('user not found');

    if (user.status == userstatus.Offline) {
      throw new BadRequestException('you need to login again');
    }

    if (user.status == userstatus.Suspended) {
      throw new ForbiddenException(
        'Your account has been banned, please contact us',
      );
    }

    request.currentUser = user;

    return true;
  }
}
