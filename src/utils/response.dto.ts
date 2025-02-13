import { Expose } from 'class-transformer';

export class ResponseDTO<T> {
  @Expose()
  statusCode: number;

  @Expose()
  message: string;

  @Expose()
  data?: T;

  constructor(statusCode: number, message: string, data?: T) {
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
  }

  static success<T>(data?: T, message = 'Success'): ResponseDTO<T> {
    return new ResponseDTO<T>(200, message, data);
  }

  static error<T>(message = 'Error', statusCode = 400, data?: T): ResponseDTO<T> {
    return new ResponseDTO<T>(statusCode, message, data);
  }
}
