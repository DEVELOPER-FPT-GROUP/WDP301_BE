import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FamiliesModule } from './modules/families/families.module';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env"
    }),
    MongooseModule.forRoot(
      "mongodb://localhost:27017/genealogy"
    ),
    FamiliesModule,
  ],
})
export class AppModule {}
