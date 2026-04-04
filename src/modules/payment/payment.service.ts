import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PaymentRepository } from './payment.repository';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { FinalizePaymentDto } from './dto/finalize-payment.dto';
import { OrderStatus, Prisma } from '../../generated/prisma/client';

@Injectable()
export class PaymentService {
  constructor(private readonly paymentRepository: PaymentRepository) {}

  async finalize(dto: FinalizePaymentDto) {
    const orderIdValue = dto.order_id;
    const orderId = BigInt(orderIdValue);
    const amountNumber = Number(dto.amount);

    if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
      throw new BadRequestException('Số tiền không hợp lệ');
    }

    const method = String(dto.method ?? '').toUpperCase();
    if (!['CASH', 'CARD', 'VNPAY'].includes(method)) {
      throw new BadRequestException('Phương thức thanh toán không hợp lệ');
    }

    const transactionId = dto.transaction_id
      ? String(dto.transaction_id)
      : undefined;
    if (method === 'VNPAY' && !transactionId) {
      throw new BadRequestException('transaction_id là bắt buộc với VNPAY');
    }

    const order = await this.paymentRepository.findOrderForFinalize(orderId);
    if (!order || order.deleted_at) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== OrderStatus.READY && order.status !== OrderStatus.PREPARING) {
      throw new BadRequestException('Đơn hàng chưa sẵn sàng để thanh toán');
    }

    const existingPayment = await this.paymentRepository.findByOrderId(orderId);
    if (existingPayment) {
      throw new BadRequestException('Đơn hàng đã thanh toán');
    }

    const amountDecimal = new Prisma.Decimal(amountNumber).toDecimalPlaces(2);
    const finalAmountDecimal = order.final_amount.toDecimalPlaces(2);
    if (!finalAmountDecimal.equals(amountDecimal)) {
      throw new BadRequestException('Số tiền không khớp');
    }

    const pointsAdded = order.customer_id
      ? Math.floor(amountNumber / 100000) * 10
      : 0;

    const payment = await this.paymentRepository.finalizePayment({
      orderId,
      amount: amountDecimal,
      method,
      transactionId,
      tableId: order.table_id,
      customerId: order.customer_id,
      pointsToAdd: pointsAdded,
    });

    return {
      message: 'Thanh toán thành công. Đã in hóa đơn.',
      payment,
      points_added: pointsAdded,
    };
  }

  async create(createPaymentDto: CreatePaymentDto) {
    return this.paymentRepository.create(createPaymentDto);
  }

  async findAll() {
    return this.paymentRepository.findAll();
  }

  async findOne(id: bigint) {
    const payment = await this.paymentRepository.findById(id);
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }
    return payment;
  }

  async update(id: bigint, updatePaymentDto: UpdatePaymentDto) {
    await this.findOne(id);
    return this.paymentRepository.update(id, updatePaymentDto);
  }
}
