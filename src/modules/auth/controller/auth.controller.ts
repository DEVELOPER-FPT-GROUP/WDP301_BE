import { Controller, Post, Body } from '@nestjs/common';
import { AuthResponseDto } from '../dto/response/auth.dto';
import { LoginDto } from '../dto/request/login.dto';
import { AuthService } from '../service/auth.service';
import { RefreshTokenDto } from '../dto/request/refreshToken.dto';
import { ResponseDTO } from '../../../utils/response.dto';
import { LogoutDto } from '../dto/request/logout.dto';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('login')
    async login(@Body() loginDto: LoginDto): Promise<ResponseDTO<AuthResponseDto>> {
        const authResponse = await this.authService.login(loginDto);
        return ResponseDTO.success(authResponse, 'Login successful');
    }

    @Post('refresh-token')
    async refreshToken(@Body() refreshTokenDto: RefreshTokenDto): Promise<ResponseDTO<AuthResponseDto>> {
        const authResponse = await this.authService.refreshToken(refreshTokenDto);
        return ResponseDTO.success(authResponse, 'Refresh token successful');
    }


    @Post('logout')
    async logout(@Body() logoutDto: LogoutDto): Promise<ResponseDTO<any>> {
        await this.authService.logout(logoutDto)
        return ResponseDTO.success(null, 'Logout successful');
    }
}
