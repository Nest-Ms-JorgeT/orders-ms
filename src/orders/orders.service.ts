import {
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { PrismaClient } from '@prisma/client';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { OrderPaginationDto } from './dto/order-pagination.dto';
import { ChangeOrderStatusDto, PaidOrderDto } from './dto';
import { NATS_SERVICE } from 'src/config';
import { firstValueFrom } from 'rxjs';
import { OrderWithProducts } from './entities/product.entity';

type Product = {
  price: number;
  id: number;
  name: string;
};

@Injectable()
export class OrdersService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger('ProductsService');
  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {
    super();
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Database connected');
  }

  async create(createOrderDto: CreateOrderDto) {
    try {
      const productIds = createOrderDto.items.map((it) => it.id);
      const products: Product[] = await firstValueFrom(
        this.client.send({ cmd: 'validate_products' }, productIds),
      );

      const totalAmount = this.orderAmount(createOrderDto, products);

      const totalItems = this.totalItems(createOrderDto);

      const order = await this.order.create({
        data: {
          totalAmount: totalAmount,
          totalItems: totalItems,
          status: 'PENDING',
          OrderItem: {
            createMany: {
              data: createOrderDto.items.map((orderItem) => ({
                price: products.find((product) => product.id === orderItem.id)
                  .price,
                productId: orderItem.id,
                quantity: orderItem.quantity,
              })),
            },
          },
        },
        include: {
          OrderItem: {
            select: {
              price: true,
              quantity: true,
              productId: true,
            },
          },
        },
      });

      return {
        ...order,
        OrderItem: order.OrderItem.map((orderItem) => ({
          ...orderItem,
          name: products.find((product) => product.id === orderItem.productId)
            .name,
        })),
      };
    } catch (error) {
      console.log(error);
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'Clear message for user :). Check logs.',
      });
    }
  }

  async findAll(orderPaginationDto: OrderPaginationDto) {
    const totalResults = await this.order.count({
      where: {
        status: orderPaginationDto.status,
      },
    });

    const currentPage = orderPaginationDto.page;
    const perPage = orderPaginationDto.limit;

    const orders = await this.order.findMany({
      skip: (currentPage - 1) * perPage,
      take: perPage,
      where: {
        status: orderPaginationDto.status,
      },
    });
    return {
      meta: {
        total: totalResults,
        page: currentPage,
        lastPage: Math.ceil(totalResults / perPage),
      },
      data: orders,
    };
  }

  async findOne(id: string) {
    const order = await this.order.findUnique({
      where: { id },
      include: {
        OrderItem: {
          select: { id: true, price: true, productId: true, quantity: true },
        },
      },
    });
    if (!order) {
      throw new RpcException({
        message: `Order not found`,
        status: HttpStatus.NOT_FOUND,
      });
    }

    const products: Product[] = await firstValueFrom(
      this.client.send(
        { cmd: 'validate_products' },
        order.OrderItem.map((it) => it.productId),
      ),
    );

    return {
      ...order,
      OrderItem: order.OrderItem.map((orderItem) => ({
        ...orderItem,
        name: products.find((product) => product.id === orderItem.productId)
          .name,
      })),
    };
  }

  async changeOrderStatus(changeOrderStatusDto: ChangeOrderStatusDto) {
    const { id, status } = changeOrderStatusDto;
    const order = await this.findOne(id);

    if (order.status === status) {
      return order;
    }

    return this.order.update({
      where: { id },
      data: { status },
    });
  }

  async createPaymentSession(order: OrderWithProducts) {
    const paymentSession = await firstValueFrom(
      this.client.send('create.payment.session', {
        orderId: order.id,
        currency: 'usd',
        items: order.OrderItem.map((item) => ({
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
      }),
    );
    return paymentSession;
  }

  async paidOrder (paidOrderDto: PaidOrderDto) {
    this.logger.log('Order Paid');
    this.logger.log(paidOrderDto);

    const updatedOrder = await this.order.update({
      where: {id: paidOrderDto.orderId},
      data: {
        status: 'PAID',
        paid: true,
        paidAt: new Date(),
        stripeChargeId: paidOrderDto.stripePaymentId,
        OrderReceipt: {
          create: {
            reciptUrl: paidOrderDto.reciptUrl
          }
        }
      }
    })

    return updatedOrder;
  }

  private orderAmount(dto: CreateOrderDto, products: Product[]) {
    return dto.items.reduce((acc, orderItem) => {
      const price = products.find((prod) => prod.id === orderItem.id).price;
      return price * orderItem.quantity;
    }, 0);
  }

  private totalItems(dto: CreateOrderDto) {
    return dto.items.reduce((acc, orderItem) => {
      return acc + orderItem.quantity;
    }, 0);
  }
}
