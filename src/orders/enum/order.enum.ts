import { OrderStatus } from "@prisma/client";

export const OrderStatuslist = [
  OrderStatus.CANCELED,
  OrderStatus.DELIVERED,
  OrderStatus.PENDING
]