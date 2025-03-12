import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Gender } from '../../../../utils/enum';

export class RegisterDto {
    @IsNotEmpty()
    @IsString()
    familyName: string;

    @IsNotEmpty()
    @IsString()
    username: string;

    @IsNotEmpty()
    @IsString()
    password: string;
}
