import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { OrderStatus, Prisma } from '../../generated/prisma/client';

@Injectable()
export class OrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findExistingDishIds(ids: bigint[]) {
    const dishes = await this.prisma.dish.findMany({
      where: { id: { in: ids }, deleted_at: null },
      select: { id: true },
    });
    return new Set(dishes.map((d) => d.id));
  }

  async tableExists(id: bigint) {
    const table = await this.prisma.table.findFirst({
      where: { id, deleted_at: null },
      select: { id: true },
    });
    return Boolean(table);
  }

  findAll() {
    return this.prisma.order.findMany({
      include: { order_items: true, customer: true, table: true },
    });
  }

  findById(id: bigint) {
    return this.prisma.order.findUnique({
      where: { id },
      include: {
        order_items: {
          include: {
            dish: {
              select: {
                name: true,
                image_url: true,
                price: true,
              },
            },
          },
        },
        customer: {
          select: {
            full_name: true,
            email: true,
            phone: true,
          },
        },
        table: true,
      },
    });
  }

  findCustomerOrders(customerId: bigint, status?: string) {
    const where: any = { customer_id: customerId };
    if (status) {
      where.status = status;
    }
    return this.prisma.order.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: {
        order_items: {
          include: {
            dish: {
              select: {
                name: true,
                image_url: true,
              },
            },
          },
        },
      },
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

  async getStaffKitchenPulse() {
    return this.prisma.orderItem.findMany({
      where: {
        status: 'READY',
      },
      include: {
        dish: {
          select: {
            name: true,
          },
        },
        order: {
          select: {
            table: {
              select: {
                table_number: true,
              },
            },
          },
        },
      },
      orderBy: {
        id: 'asc',
      },
    });
  }

  async create(data: Prisma.OrderUncheckedCreateInput) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.create({ data, include: { order_items: true } });
      
      if (data.table_id) {
        await tx.table.update({
          where: { id: data.table_id },
          data: { status: 'OCCUPIED' },
        });
      }
      
      return order;
    });
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

  async cancelAllOrderItems(orderId: bigint) {
    return this.prisma.orderItem.updateMany({
      where: { order_id: orderId, status: { not: 'CANCELLED' } },
      data: { status: 'CANCELLED' },
    });
  }

  async updateTableStatus(tableId: bigint, status: string) {
    return this.prisma.table.update({
      where: { id: tableId },
      data: { status },
    });
  }

  async countActiveItems(orderId: bigint) {
    return this.prisma.orderItem.count({
      where: {
        order_id: orderId,
        status: { not: 'CANCELLED' },
      },
    });
  }

  async hasActiveOrder(tableId: bigint) {
    const activeOrder = await this.prisma.order.findFirst({
      where: {
        table_id: tableId,
        status: {
          notIn: ['COMPLETED', 'CANCELLED'],
        },
      },
    });
    return Boolean(activeOrder);
  }

  async findActiveOrderByTableId(tableId: bigint) {
    return this.prisma.order.findFirst({
      where: {
        table_id: tableId,
        status: {
          notIn: ['COMPLETED', 'CANCELLED'],
        },
      },
      include: {
        order_items: {
          include: {
            dish: {
              select: {
                id: true,
                name: true,
                price: true,
                image_url: true,
              },
            },
          },
        },
        table: true,
      },
      orderBy: { created_at: 'desc' },
    });
  }
}
