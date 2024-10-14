import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { envs, PRODUCTS_SERVICE } from 'src/config';

@Module({
  controllers: [OrdersController],
  providers: [OrdersService],
  imports: [
    ClientsModule.register([
      {
        transport: Transport.TCP,
        name: PRODUCTS_SERVICE,
        options:{
          host: envs.productsMs.host,
          port: envs.productsMs.port
        }
      }
    ])
  ]
})
export class OrdersModule {}
