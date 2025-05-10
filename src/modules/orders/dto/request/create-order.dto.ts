import { IsString, IsNotEmpty, IsEmail, IsEnum, IsOptional } from 'class-validator';
import { SubscriptionType } from '../../schema/order.schema';

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @IsString()
  @IsNotEmpty()
  transactionId: string;

  @IsEnum(SubscriptionType)
  @IsNotEmpty()
  subscription: SubscriptionType;

  @IsNotEmpty()
  price: number;
}
