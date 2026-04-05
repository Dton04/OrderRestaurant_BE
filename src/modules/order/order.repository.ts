import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { OrderStatus, Prisma } from '../../generated/prisma/client';

@Injectable()
export class OrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.order.findMany({
      include: { order_items: true, customer: true, table: true },
    });
  }

  findById(id: bigint) {
    return this.prisma.order.findUnique({
      where: { id },
      include: { order_items: true, customer: true, table: true },
    });
  }

  async findOrderItemById(id: bigint) {
    return this.prisma.orderItem.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            table: true,
            customer: {
              select: {
                full_name: true,
              },
            },
          },
        },
        dish: {
          select: {
            name: true,
            image_url: true,
          },
        },
      },
    });
  }

  async getChefDailySummary(date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const results = await this.prisma.orderItem.groupBy({
      by: ['dish_id'],
      where: {
        status: 'READY',
        order: {
          updated_at: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      },
      _sum: {
        quantity: true,
      },
    });

    const summary = await Promise.all(
      results.map(async (item) => {
        const dish = await this.prisma.dish.findUnique({
          where: { id: item.dish_id },
          select: { name: true },
        });
        return {
          dish_name: dish?.name || 'Unknown',
          total_cooked: item._sum.quantity || 0,
        };
      }),
    );

    return summary;
  }

  async getKitchenQueue() {
    return this.prisma.orderItem.findMany({
      where: {
        status: {
          in: ['PENDING', 'PREPARING'],
        },
      },
      include: {
        dish: {
          select: {
            name: true,
          },
        },
        order: {
          select: {
            id: true,
            created_at: true,
            final_amount: true,
            total_amount: true,
            discount_amount: true,
            order_type: true,
            table_id: true,
            table: {
              select: {
                table_number: true,
              },
            },
          },
        },
      },
      orderBy: {
        order: {
          created_at: 'asc',
        },
      },
    });
  }

  create(data: Prisma.OrderUncheckedCreateInput) {
    return this.prisma.order.create({ data, include: { order_items: true } });
  }

  update(id: bigint, data: Prisma.OrderUncheckedUpdateInput) {
    return this.prisma.order.update({ where: { id }, data });
  }

  async updateOrderItemStatus(id: bigint, status: OrderStatus) {
    return this.prisma.orderItem.update({
      where: { id },
      data: { status },
    });
  }

  async countUnfinishedItems(orderId: bigint) {
    return this.prisma.orderItem.count({
      where: {
        order_id: orderId,
        status: { not: 'READY' },
      },
    });
  }

  delete(id: bigint) {
    return this.prisma.order.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
  }
}
