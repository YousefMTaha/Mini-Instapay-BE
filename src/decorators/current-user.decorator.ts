import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const currentUser = createParamDecorator(
  (data: never, input: ExecutionContext) => {
    const request = input.switchToHttp().getRequest();

    return request.currentUser;
  },
);
