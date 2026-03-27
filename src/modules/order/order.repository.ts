import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Prisma } from '../../generated/prisma/client';

@Injectable()
export class OrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.order.findMany({
      include: { order_items: true, customer: true, table: true },
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

  async delete(id: bigint) {
    return this.prisma.order.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
  }
}
