import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { FirebaseStorageService } from './firebase.storge.service';


const firebaseProvider = {
  provide: 'FIREBASE_APP',
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    const firebaseConfig = {
      type: configService.get<string>('TYPE'),
      projectId: configService.get<string>('PROJECT_ID'),
      privateKeyId: configService.get<string>('PRIVATE_KEY_ID'),
      privateKey: configService.get<string>('PRIVATE_KEY')?.replace(/\\n/g, '\n'),
      clientEmail: configService.get<string>('CLIENT_EMAIL'),
      clientId: configService.get<string>('CLIENT_ID'),
      authUri: configService.get<string>('AUTH_URI'),
      tokenUri: configService.get<string>('TOKEN_URI'),
      authProviderCertUrl: configService.get<string>('AUTH_CERT_URL'),
      clientCertUrl: configService.get<string>('CLIENT_CERT_URL'),
      universeDomain: configService.get<string>('UNIVERSAL_DOMAIN'),
    } as admin.ServiceAccount;

    return admin.initializeApp({
      credential: admin.credential.cert(firebaseConfig),
      storageBucket: `${firebaseConfig.projectId}.appspot.com`,
    });
  },
};

@Module({
  imports: [ConfigModule],
  providers: [firebaseProvider, FirebaseStorageService], // ✅ Đảm bảo `FirebaseStorageService` có trong providers
  exports: [FirebaseStorageService], // ✅ Đảm bảo `FirebaseStorageService` được export
})
export class FirebaseModule {}
