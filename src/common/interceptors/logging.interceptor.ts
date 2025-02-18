import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
  } from '@nestjs/common';
  import { Observable, tap } from 'rxjs';
  import { map, catchError } from 'rxjs/operators';
  
  @Injectable()
  export class LoggingInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
      const request = context.switchToHttp().getRequest();
      const method = request.method;
      const url = request.url;
  
      console.log(`[Request] ${method} ${url} - Processing...`);
  
      return next.handle().pipe(
        map((data) => {
          console.log(`[Success] ${method} ${url} - Status: 200`);
          return data;
        }),
        catchError((err) => {
          const status = err.status || 500;
          console.error(`[Error] ${method} ${url} - Status: ${status}`, err.message);
          throw err;
        }),
      );
    }
  }
  