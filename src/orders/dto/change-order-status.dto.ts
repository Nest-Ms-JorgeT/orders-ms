import { OrderStatus } from "@prisma/client";
import { IsEnum, IsUUID } from "class-validator";
import { OrderStatuslist } from "../enum/order.enum";

export class ChangeOrderStatusDto {
  @IsUUID(4)
  id:string;
  @IsEnum(OrderStatuslist, {
    message: `Valid status are ${OrderStatuslist}`
  })
  status: OrderStatus
}