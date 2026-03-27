import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany();
  }

  async findById(id: bigint) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });
  }

  async findByPhone(phone: string) {
    return this.prisma.user.findUnique({ where: { phone } });
  }

  async findRoleByName(name: string) {
    return this.prisma.role.findFirst({ where: { name } });
  }

  async create(data: any) {
    return this.prisma.user.create({ data, include: { role: true } });
  }

  async update(id: bigint, data: any) {
    return this.prisma.user.update({ where: { id }, data });
  }

  async delete(id: bigint) {
    return this.prisma.user.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
  }
}
