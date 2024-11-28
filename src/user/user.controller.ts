import { Body, Controller, Patch, UseFilters, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { UnHandledExceptions } from 'src/filters/unhandeldErrors.filter';
import { AuthGuard } from 'src/guards/auth.guard';
import { currentUser } from 'src/decorators/current-user.decortaor';
import { userType } from 'src/schemas/user.schema';

@UseFilters(UnHandledExceptions)
@UseGuards(AuthGuard)
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Patch()
  updateUser(@currentUser() user: userType, @Body() body: any) {
    return this.userService.updateUser(user, body);
  }

  @Patch('updatePassword')
  updatePassword(@currentUser() userData: userType, @Body() body: any) {
    return this.userService.updatePassword(userData, body);
  }
}
