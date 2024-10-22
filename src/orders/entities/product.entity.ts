import {OrderStatus} from '@prisma/client'

export class Product {
  name: any;
  productId: number;
  quantity: number;
  price: number;
}

export class OrderWithProducts {
  OrderItem: Product[];
  id: string;
  totalAmount: number;
  totalItems: number;
  status: OrderStatus;
  paid: boolean;
  paidAt: Date;
  createdAt: Date;
  updatedAt: Date;
}