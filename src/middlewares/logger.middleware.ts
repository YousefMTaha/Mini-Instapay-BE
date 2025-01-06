import { NestMiddleware } from '@nestjs/common';

export class LoggerMiddleware implements NestMiddleware {
  use(req: any, res: any, next: (error?: Error | any) => void) {
    console.log(
      `${req.url} with method ${req.method}  body ${JSON.stringify(req.body)}`,
    );
    next();
  }
}
