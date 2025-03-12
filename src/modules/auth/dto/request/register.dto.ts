import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Gender } from '../../../../utils/enum';

export class RegisterDto {
    @IsNotEmpty()
    familyName: string;

    @IsString()
    @IsNotEmpty()
    username: string;

    @IsString()
    @IsNotEmpty()
    password: string;

    @IsOptional()
    @IsString()
    email?: string;

    @IsOptional()
    @IsString()
    memberId?: string;
}
