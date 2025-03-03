import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FamiliesModule } from './modules/families/families.module';
import { MongooseModule } from '@nestjs/mongoose';
import { MembersModule } from './modules/members/members.module';
import { MarriagesModule } from './modules/marriages/marriages.module';
import { ParentChildRelationshipsModule } from './modules/parent-child-relationships/parent-child-relationships.module';
import { RelationshipTypesModule } from './modules/relationship-types/relationship-types.module';
import { EventsModule } from './modules/events/events.module';
import { MediaModule } from './modules/media/media.module';
import { FamilyHistoryRecordModule } from './modules/family-history-records/family-history-records.module';
import { AccountsModule } from './modules/accounts/accounts.module';
import { AuthModule } from './modules/auth/auth.module';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env"
    }),
    MongooseModule.forRoot(
      "mongodb://localhost:27017/genealogy"
    ),
    MulterModule.register({
      storage: memoryStorage(), // Lưu files trong memory trước khi upload lên Cloudinary
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
      },
    }),
    FamiliesModule,
    MembersModule,
    MarriagesModule,
    ParentChildRelationshipsModule,
    RelationshipTypesModule,
    EventsModule,
    MediaModule,
    FamilyHistoryRecordModule,
    AccountsModule,
    AuthModule
  ],
})
export class AppModule {}
