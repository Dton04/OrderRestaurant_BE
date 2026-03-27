import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class PaymentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.payment.findMany({ include: { order: true } });
  }

  async findById(id: bigint) {
    return this.prisma.payment.findUnique({
      where: { id },
      include: { order: true },
    });
  }

  async create(data: any) {
    return this.prisma.payment.create({ data });
  }

  async update(id: bigint, data: any) {
    return this.prisma.payment.update({ where: { id }, data });
  }
}
