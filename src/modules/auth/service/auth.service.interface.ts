import { AccountResponseDto } from '../../accounts/dto/response/account.dto';
import { AuthResponseDto } from '../dto/response/auth.dto';
import { LoginDto } from '../dto/request/login.dto';
import { RefreshTokenDto } from '../dto/request/refreshToken.dto';
import { LogoutDto } from '../dto/request/logout.dto';

export interface IAuthService {
  /**
   * Validates the user credentials and returns account details if valid.
   * @param username - The username of the user.
   * @param password - The plaintext password of the user.
   * @returns AccountResponseDto if validation succeeds, otherwise null.
   */
  validateUser(username: string, password: string): Promise<AccountResponseDto | null>;

  /**
   * Handles user login and returns JWT access & refresh tokens.
   * @param loginDto - The login credentials.
   * @returns AuthResponseDto containing accessToken and refreshToken.
   */
  login(loginDto: LoginDto): Promise<AuthResponseDto>;

  /**
   * Issues a new access token using a valid refresh token (Refresh Token Rotation).
   * @param refreshTokenDto - The refresh token provided by the client.
   * @returns AuthResponseDto containing a new accessToken and refreshToken.
   */
  refreshToken(refreshTokenDto: RefreshTokenDto): Promise<AuthResponseDto>;

  /**
   * Handles user logout by invalidating refresh tokens (client-side).
   * @returns A message confirming successful logout.
   */
  logout(logoutDto: LogoutDto): Promise<void>;
}
