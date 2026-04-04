import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class TableRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.table.findMany({ include: { area: true } });
  }

  async findById(id: bigint) {
    return this.prisma.table.findUnique({
      where: { id },
      include: { area: true },
    });
  }

  async create(data: any) {
    return this.prisma.table.create({ data });
  }

  async update(id: bigint, data: any) {
    return this.prisma.table.update({ where: { id }, data });
  }

  async delete(id: bigint) {
    return this.prisma.table.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
  }
}
