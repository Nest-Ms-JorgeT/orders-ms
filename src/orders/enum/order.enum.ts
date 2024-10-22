import { OrderStatus } from "@prisma/client";
import { Order } from "../entities/order.entity";

export const OrderStatuslist = [
  OrderStatus.CANCELED,
  OrderStatus.DELIVERED,
  OrderStatus.PENDING,
  OrderStatus.PAID
]