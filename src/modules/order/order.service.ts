import { Injectable, NotFoundException } from '@nestjs/common';
import { OrderRepository } from './order.repository';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Injectable()
export class OrderService {
  constructor(private readonly orderRepository: OrderRepository) {}

  async create(createOrderDto: CreateOrderDto) {
    const { items, ...orderData } = createOrderDto;

    // Formatting data for Prisma nested write
    const createData = {
      ...orderData,
      order_items: {
        create: items.map((item) => ({
          dish_id: item.dish_id,
          quantity: item.quantity,
          price_at_order: item.price_at_order,
          status: 'PENDING',
        })),
      },
    };

    return this.orderRepository.create(createData);
  }

  async findAll() {
    return this.orderRepository.findAll();
  }

  async findOne(id: bigint) {
    const orderInfo = await this.orderRepository.findById(id);
    if (!orderInfo) {
      throw new NotFoundException('Order not found');
    }
    return orderInfo;
  }

  async update(id: bigint, updateOrderDto: UpdateOrderDto) {
    await this.findOne(id);
    return this.orderRepository.update(id, updateOrderDto);
  }

  async remove(id: bigint) {
    await this.findOne(id);
    return this.orderRepository.delete(id);
  }
}
