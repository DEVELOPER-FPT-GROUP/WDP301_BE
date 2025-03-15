import { IsString, IsOptional, IsEmail, IsEnum } from 'class-validator';
import { SubscriptionStatus, SubscriptionType } from '../../schema/order.schema';

export class UpdateOrderDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsEnum(SubscriptionType)
  subscription?: SubscriptionType;

  @IsOptional()
  price?: number;

  @IsOptional()
  @IsEnum(SubscriptionStatus)
  status?: SubscriptionStatus;
}
