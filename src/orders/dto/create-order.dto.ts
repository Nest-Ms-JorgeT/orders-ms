import { ArrayMaxSize, IsArray, ValidateNested } from "class-validator";
import { CreateOrderItemDto } from "./order-item.dto";
import { Type } from "class-transformer";

export class CreateOrderDto {
  @IsArray()
  @ArrayMaxSize(1)
  @ValidateNested({each: true})
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[]
}

// export class CreateOrderDto {
//   @IsNumber()
//   @IsPositive()
//   totalAmount: number;
//   @IsNumber()
//   @IsPositive()
//   totalItems: number;
//   @IsEnum(OrderStatuslist, {
//     message: `Possible status values are ${OrderStatuslist}`,
//   })
//   @IsOptional()
//   status: OrderStatus = OrderStatus.PENDING;
//   @IsBoolean()
//   @IsOptional()
//   paid: boolean = false
// }
