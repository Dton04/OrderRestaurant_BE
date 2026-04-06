import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentRepository } from './payment.repository';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { FinalizePaymentDto } from './dto/finalize-payment.dto';
import { OrderStatus, Prisma } from '../../generated/prisma/client';
import * as crypto from 'node:crypto';
import * as querystring from 'node:querystring';

@Injectable()
export class PaymentService {
  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly configService: ConfigService,
  ) { }

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

    if (
      order.status !== OrderStatus.READY &&
      order.status !== OrderStatus.PREPARING
    ) {
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
    const rawPayload = createPaymentDto as unknown as Record<string, unknown>;
    const rawOrderId = rawPayload.order_id ?? rawPayload.orderId;
    const orderIdNumber =
      typeof rawOrderId === 'bigint'
        ? Number(rawOrderId)
        : typeof rawOrderId === 'number'
          ? rawOrderId
          : typeof rawOrderId === 'string'
            ? Number(rawOrderId)
            : NaN;

    if (!Number.isInteger(orderIdNumber) || orderIdNumber <= 0) {
      throw new BadRequestException('order_id (or orderId) is invalid');
    }

    const amountNumber = Number(rawPayload.amount);
    if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
      throw new BadRequestException('amount is invalid');
    }

    const methodRaw = rawPayload.method;
    if (typeof methodRaw !== 'string' || !methodRaw.trim()) {
      throw new BadRequestException('method is required');
    }
    const method = methodRaw.toUpperCase();

    const statusRaw = rawPayload.status;
    const status =
      typeof statusRaw === 'string' && statusRaw.trim()
        ? statusRaw.toUpperCase()
        : 'SUCCESS';

    const transactionIdRaw = rawPayload.transaction_id;
    const transactionId =
      typeof transactionIdRaw === 'string' && transactionIdRaw.trim()
        ? transactionIdRaw
        : undefined;

    try {
      return await this.paymentRepository.create({
        order_id: BigInt(orderIdNumber),
        amount: new Prisma.Decimal(amountNumber).toDecimalPlaces(2),
        method,
        status,
        transaction_id: transactionId,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Payment already exists for this order');
      }

      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new BadRequestException('order_id does not exist');
      }

      throw error;
    }
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

  async createVNPayUrl(orderIdValue: string | number, ipAddr: string) {
    const orderId = BigInt(orderIdValue);
    const order = await this.paymentRepository.findOrderForFinalize(orderId);
    if (!order || order.deleted_at) {
      throw new NotFoundException('Order not found');
    }

    if (
      order.status !== 'READY' &&
      order.status !== 'PREPARING' &&
      order.status !== 'PENDING'
    ) {
      throw new BadRequestException('Đơn hàng không ở trạng thái sẵn sàng để thanh toán');
    }

    const tmnCode = (this.configService.get<string>('VNPAY_TMN_CODE') || '').trim();
    const secretKey = (this.configService.get<string>('VNPAY_HASH_SECRET') || '').trim();
    const vnpUrl = (this.configService.get<string>('VNPAY_URL') || '').trim();
    const returnUrl = (this.configService.get<string>('VNPAY_RETURN_URL') || '').trim();

    const date = new Date();
    const createDate = this.formatDate(date);

    // VNPay sandbox logic often prefers IPv4
    const finalizedIpAddr = ipAddr === '::1' || ipAddr === '127.0.0.1' ? '127.0.0.1' : ipAddr;

    // final_amount is Decimal, we need total in integer (cents)
    const amount = Math.floor(Number(order.final_amount) * 100);

    const vnp_Params: Record<string, string> = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: tmnCode,
      vnp_Locale: 'vn',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: orderId.toString(),
      vnp_OrderInfo: `Thanh toan don hang ${orderId.toString()}`,
      vnp_OrderType: 'other',
      vnp_Amount: amount.toString(),
      vnp_ReturnUrl: returnUrl,
      vnp_IpAddr: finalizedIpAddr,
      vnp_CreateDate: createDate,
    };

    const sortedParams = this.sortObject(vnp_Params);

    // BUILD CHUỖI BĂM: Phải encode từng giá trị
    const signData = Object.keys(sortedParams)
      .map((key) => {
        const value = encodeURIComponent(sortedParams[key]).replace(/%20/g, '+');
        return `${key}=${value}`;
      })
      .join('&');

    const hmac = crypto.createHmac('sha512', secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex').toUpperCase();

    // BUILD QUERY STRING: Dùng trực tiếp sortedParams
    const queryParams = querystring.stringify(sortedParams);

    return `${vnpUrl}?${queryParams}&vnp_SecureHash=${signed}`;
  }

  async handleVNPayCallback(query: any) {
    const vnp_Params = { ...query };
    const secureHash = vnp_Params['vnp_SecureHash'];

    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    const sortedParams = this.sortObject(vnp_Params);
    const secretKey = (this.configService.get<string>('VNPAY_HASH_SECRET') || '').trim();

    const signData = Object.keys(sortedParams)
      .map((key) => {
        const value = encodeURIComponent(sortedParams[key]).replace(/%20/g, '+');
        return `${key}=${value}`;
      })
      .join('&');

    const hmac = crypto.createHmac('sha512', secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex').toUpperCase();

    if (secureHash?.toUpperCase() !== signed) {
      return { success: false, message: 'Sai chữ ký bảo mật' };
    }

    const orderId = BigInt(vnp_Params['vnp_TxnRef']);
    const responseCode = vnp_Params['vnp_ResponseCode'];

    if (responseCode === '00') {
      try {
        const order = await this.paymentRepository.findOrderForFinalize(orderId);
        if (!order) return { success: false, message: 'Không tìm thấy đơn hàng' };

        const amountNumber = Number(order.final_amount);
        const pointsAdded = Math.floor(amountNumber / 100000) * 10;

        await this.paymentRepository.finalizePayment({
          orderId,
          amount: order.final_amount,
          method: 'VNPAY',
          transactionId: vnp_Params['vnp_TransactionNo'],
          tableId: order.table_id,
          customerId: order.customer_id,
          pointsToAdd: pointsAdded,
        });

        return { success: true, orderId: orderId.toString() };
      } catch (e) {
        console.error('VNPay finalize error:', e);
        return { success: false, message: 'Lỗi khi hoàn tất thanh toán' };
      }
    }

    return { success: false, responseCode };
  }

  private sortObject(obj: any) {
    const sorted = {};
    const keys = Object.keys(obj).sort();
    for (const key of keys) {
      if (obj[key] !== undefined && obj[key] !== null && obj[key] !== '') {
        sorted[key] = obj[key];
      }
    }
    return sorted;
  }

  private formatDate(date: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return (
      date.getFullYear().toString() +
      pad(date.getMonth() + 1) +
      pad(date.getDate()) +
      pad(date.getHours()) +
      pad(date.getMinutes()) +
      pad(date.getSeconds())
    );
  }
}
