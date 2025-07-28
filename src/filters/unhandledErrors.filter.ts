import {
  Catch,
  ArgumentsHost,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

@Catch()
export class UnHandledExceptions implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const httpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message = 'Internal server error';
    if (exception instanceof HttpException) {
      const responseMessage = exception.getResponse();

      if (typeof responseMessage === 'string') {
        message = responseMessage;
      } else if (
        typeof responseMessage === 'object' &&
        responseMessage !== null
      ) {
        message = (responseMessage as any).message || message;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    host.switchToHttp().getResponse().status(httpStatus).json({
      statusCode: httpStatus,
      message,
      status: false,
    });
  }
}
