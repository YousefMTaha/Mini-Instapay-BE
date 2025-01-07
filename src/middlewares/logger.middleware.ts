import { NestMiddleware } from '@nestjs/common';
import { Request, Response } from 'express';

export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: (error?: Error | any) => void) {
    console.log(
      `User with ip: ${req.ip} send request with:
       URL: ${req.url}
       method: ${req.method}
       body: ${JSON.stringify(req.body)}`,
    );
    next();
  }
}
