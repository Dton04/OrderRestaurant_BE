import { Injectable, NotFoundException } from '@nestjs/common';
import { OrderRepository } from './order.repository';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { EventsGateway } from '../events/events.gateway';
import { OrderStatus } from '../../generated/prisma/client';

@Injectable()
export class OrderService {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly eventsGateway: EventsGateway,
  ) {}

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

    const newOrder = await this.orderRepository.create(createData);
    
    // For BigInt serialization over WebSockets we might need to convert it to string
    // Here we wrap with JSON.parse and JSON.stringify with a custom replacer if it occurs,
    // or just emit. Socket.io might fail on native BigInt, let's map it safely.
    // For simplicity, we emit the order object (note: frontend might need BigInt parsed)
    this.eventsGateway.server.emit('new-order', {
      ...newOrder,
      id: newOrder.id.toString(),
      customer_id: newOrder.customer_id?.toString(),
      staff_id: newOrder.staff_id?.toString(),
      table_id: newOrder.table_id?.toString(),
      voucher_id: newOrder.voucher_id?.toString(),
      order_items: newOrder.order_items?.map(i => ({...i, id: i.id.toString(), order_id: i.order_id.toString(), dish_id: i.dish_id.toString()}))
    });

    return newOrder;
  }

  async findAll() {
    return this.orderRepository.findAll();
  }

  async findActiveOrders() {
    // Serialize nested objects with BigInt for JSON safely
    // NestJS has issues with BigInt serialization unless using interceptor, 
    // but the controller might have one. We will just return the data.
    return this.orderRepository.findActiveOrders();
  }

  async findHistoryOrders() {
    return this.orderRepository.findHistoryOrders();
  }

  async updateOrderItemStatus(orderId: bigint, itemId: bigint, status: OrderStatus) {
    const order = await this.findOne(orderId);
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    
    const item = await this.orderRepository.findOrderItemById(itemId);
    if (!item || item.order_id !== orderId) {
      throw new NotFoundException('Order item not found in this order');
    }

    const updatedItem = await this.orderRepository.updateOrderItemStatus(itemId, status);
    
    // Optionally emit event to WebSocket indicating item status update
    this.eventsGateway.server.emit('item-status-updated', {
      orderId: orderId.toString(),
      itemId: itemId.toString(),
      status: updatedItem.status
    });

    return updatedItem;
  }

  async updateOrderStatus(id: bigint, status: OrderStatus) {
    const order = await this.findOne(id);
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    
    // We update the whole order status
    const updatedOrder = await this.orderRepository.update(id, { status });

    // Emit event to WebSocket indicating whole order status update
    this.eventsGateway.server.emit('order-status-updated', {
      orderId: id.toString(),
      status: updatedOrder.status
    });

    return updatedOrder;
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
