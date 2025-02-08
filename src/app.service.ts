import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor(private configService: ConfigService) {
    const dbUri = this.configService.get<string>('database.uri');
    console.log('Database URI:', dbUri);
  }
  getHello(): string {
    return 'Hello World!';
  }
}
