import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { OrderRepository } from './order.repository';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderStatus } from '../../generated/prisma/client';

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
          status: OrderStatus.PENDING,
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

  async getItemPreparationNotes(itemId: bigint) {
    const item = await this.orderRepository.findOrderItemById(itemId);
    if (!item) {
      throw new NotFoundException('Order item not found');
    }
    return {
      message: 'Lấy ghi chú thành công.',
      data: item,
    };
  }

  async getChefDailySummary() {
    const today = new Date();
    const data = await this.orderRepository.getChefDailySummary(today);
    return {
      message: 'Tải báo cáo chế biến thành công.',
      data,
    };
  }

  async getKitchenQueue() {
    const queue = await this.orderRepository.getKitchenQueue();
    const formattedQueue = queue.map((item) => ({
      item_id: Number(item.id),
      dish_name: item.dish.name,
      quantity: item.quantity,
      table_number: item.order.table?.table_number || 'N/A',
      notes: item.notes,
      status: item.status,
      created_at: item.order.created_at,
    }));

    return {
      message: 'Tải hàng đợi chế biến thành công.',
      data: formattedQueue,
    };
  }

  async startCooking(itemId: bigint) {
    const item = await this.orderRepository.findOrderItemById(itemId);
    if (!item) {
      throw new NotFoundException('Order item not found');
    }

    if (item.status !== 'PENDING') {
      throw new BadRequestException(
        'Món ăn phải ở trạng thái chờ (PENDING) mới có thể bắt đầu chế biến.',
      );
    }

    // 1. Cập nhật trạng thái item sang PREPARING
    await this.orderRepository.updateOrderItemStatus(
      itemId,
      OrderStatus.PREPARING,
    );

    // 2. Nếu đơn hàng đang ở trạng thái PENDING, chuyển sang PREPARING
    const order = await this.orderRepository.findById(item.order_id);
    if (order && order.status === 'PENDING') {
      await this.orderRepository.update(item.order_id, {
        status: OrderStatus.PREPARING,
      });
    }

    return {
      message: 'Món ăn đã bắt đầu được chế biến.',
    };
  }

  async finishKitchenItem(itemId: bigint) {
    const item = await this.orderRepository.findOrderItemById(itemId);
    if (!item) {
      throw new NotFoundException('Order item not found');
    }

    if (item.status !== 'PREPARING') {
      throw new BadRequestException(
        'Món ăn phải ở trạng thái đang chế biến (PREPARING) mới có thể hoàn thành.',
      );
    }

    // 1. Cập nhật trạng thái item sang READY
    await this.orderRepository.updateOrderItemStatus(itemId, OrderStatus.READY);

    // 2. Kiểm tra nếu tất cả items trong đơn đã READY
    const unfinishedCount = await this.orderRepository.countUnfinishedItems(
      item.order_id,
    );

    if (unfinishedCount === 0) {
      // 3. Cập nhật orders.status sang READY
      await this.orderRepository.update(item.order_id, {
        status: OrderStatus.READY,
      });
    }

    // TODO: Gửi thông báo đến nhân viên phục vụ qua Socket/Notification

    return {
      message: 'Món ăn đã hoàn thành, sẵn sàng phục vụ.',
    };
  }

  async update(id: bigint, updateOrderDto: UpdateOrderDto) {
    await this.findOne(id);
    const { items, ...data } = updateOrderDto;
    void items;
    return this.orderRepository.update(id, data);
  }

  async remove(id: bigint) {
    await this.findOne(id);
    return this.orderRepository.delete(id);
  }
}
