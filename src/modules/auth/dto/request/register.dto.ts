import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Gender } from '../../../../utils/enum';

export class RegisterDto {
    @IsNotEmpty()
    @IsString()
    familyName: string;

    @IsOptional()
    @IsString()
    email?: string;

    @IsOptional()
    @IsString()
    memberId?: string;

    @IsNotEmpty()
    @IsString()
    username: string;

    @IsNotEmpty()
    @IsString()
    password: string
}
