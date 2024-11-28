import { CanActivate, ExecutionContext } from '@nestjs/common';
export class AuthorizationGuard implements CanActivate {
  constructor(private _role: string) {}
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    return request.currentUser.role === this._role;
  }
}
