import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Prisma, OrderStatus } from '../../generated/prisma/client';

@Injectable()
export class OrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.order.findMany({
      include: { order_items: true, customer: true, table: true },
    });
  }

  async findActiveOrders() {
    return this.prisma.order.findMany({
      where: {
        status: {
          in: [OrderStatus.PENDING, OrderStatus.PREPARING],
        },
      },
      include: { order_items: { include: { dish: true } }, table: true },
      orderBy: { created_at: 'asc' },
    });
  }

  async findHistoryOrders() {
    return this.prisma.order.findMany({
      where: {
        status: {
          in: [OrderStatus.READY, OrderStatus.COMPLETED, OrderStatus.CANCELLED],
        },
      },
      include: { order_items: { include: { dish: true } }, table: true },
      orderBy: { updated_at: 'desc' }, // Recently finished first
      take: 50, // Limit to 50 for performance
    });
  }

  async findById(id: bigint) {
    return this.prisma.order.findUnique({
      where: { id },
      include: { order_items: true, customer: true, table: true },
    });
  }

  async create(data: Prisma.OrderUncheckedCreateInput) {
    return this.prisma.order.create({ data, include: { order_items: true } });
  }

  async update(id: bigint, data: Prisma.OrderUncheckedUpdateInput) {
    return this.prisma.order.update({ where: { id }, data });
  }

  async updateOrderItemStatus(itemId: bigint, status: OrderStatus) {
    return this.prisma.orderItem.update({
      where: { id: itemId },
      data: { status },
    });
  }

  async findOrderItemById(itemId: bigint) {
    return this.prisma.orderItem.findUnique({
      where: { id: itemId },
    });
  }

  async delete(id: bigint) {
    return this.prisma.order.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
  }
}
