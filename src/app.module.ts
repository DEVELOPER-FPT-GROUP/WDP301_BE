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
import { FirebaseModule } from './modules/firebase/firebase.module';


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
    MembersModule,
    MarriagesModule,
    ParentChildRelationshipsModule,
    RelationshipTypesModule,
    EventsModule,
    MediaModule,
    FamilyHistoryRecordModule,
    FirebaseModule
  ],
})
export class AppModule {}
