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

    @IsNotEmpty()
    firstName: string;

    @IsOptional()
    @IsString()
    middleName?: string;

    @IsNotEmpty()
    lastName: string;

    @IsOptional()
    @IsString()
    email?: string;

    @IsEnum(Gender)
    gender: Gender;
}
