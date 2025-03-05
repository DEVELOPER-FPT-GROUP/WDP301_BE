export class AuthResponseDto {
  accessToken?: string;
  refreshToken?: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }
}
