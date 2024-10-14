import { Type } from "class-transformer";
import { IsNumber, IsPositive } from "class-validator";

export class CreateOrderItemDto {
  @IsNumber()
  @IsPositive()
  id: number;
  @IsNumber()
  @IsPositive()
  quantity: number;
  @IsNumber()
  @IsPositive()
  @Type(()=> Number)
  price: number
}