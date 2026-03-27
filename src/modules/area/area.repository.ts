import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Prisma } from '../../generated/prisma/client';

@Injectable()
export class AreaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.area.findMany();
  }

  async findById(id: bigint) {
    return this.prisma.area.findUnique({ where: { id } });
  }

  async create(data: Prisma.AreaCreateInput) {
    return this.prisma.area.create({ data });
  }

  async update(id: bigint, data: Prisma.AreaUpdateInput) {
    return this.prisma.area.update({ where: { id }, data });
  }

  async delete(id: bigint) {
    return this.prisma.area.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
  }
}
