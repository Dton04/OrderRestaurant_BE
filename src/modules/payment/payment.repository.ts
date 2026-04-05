import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { OrderStatus, Prisma } from '../../generated/prisma/client';

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

  async findByOrderId(orderId: bigint) {
    return this.prisma.payment.findUnique({
      where: { order_id: orderId },
      include: { order: true },
    });
  }

  async findOrderForFinalize(orderId: bigint) {
    return this.prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        status: true,
        final_amount: true,
        table_id: true,
        customer_id: true,
        deleted_at: true,
      },
    });
  }

  async create(data: Prisma.PaymentUncheckedCreateInput) {
    return this.prisma.payment.create({ data });
  }

  async update(id: bigint, data: Prisma.PaymentUncheckedUpdateInput) {
    return this.prisma.payment.update({ where: { id }, data });
  }

  async finalizePayment(params: {
    orderId: bigint;
    amount: Prisma.Decimal;
    method: string;
    transactionId?: string;
    tableId: bigint | null;
    customerId: bigint | null;
    pointsToAdd: number;
  }) {
    const {
      orderId,
      amount,
      method,
      transactionId,
      tableId,
      customerId,
      pointsToAdd,
    } = params;

    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          order_id: orderId,
          amount,
          method,
          status: 'SUCCESS',
          transaction_id: transactionId,
        },
      });

      await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.COMPLETED },
      });

      if (tableId) {
        await tx.table.update({
          where: { id: tableId },
          data: { status: 'CLEANING' },
        });
      }

      if (customerId && pointsToAdd > 0) {
        await tx.user.update({
          where: { id: customerId },
          data: { points: { increment: pointsToAdd } },
        });

        await tx.loyaltyPoint.create({
          data: {
            user_id: customerId,
            points_changed: pointsToAdd,
            reason: `ORDER_COMPLETED_${orderId.toString()}`,
          },
        });
      }

      return tx.payment.findUnique({
        where: { id: payment.id },
        include: {
          order: {
            include: {
              table: true,
              customer: true,
              order_items: true,
            },
          },
        },
      });
    });
  }
}
