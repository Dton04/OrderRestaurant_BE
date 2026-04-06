import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Request,
  Query,
  Res,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { FinalizePaymentDto } from './dto/finalize-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';

@ApiTags('vnpay')
@Controller('api/vnpay')
@ApiBearerAuth()
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly configService: ConfigService,
  ) {}

  @Get('init/:orderId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get VNPay payment URL' })
  async initVNPay(@Param('orderId') orderId: string, @Request() req: any) {
    const ipAddr =
      req.headers['x-forwarded-for'] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      req.connection.socket.remoteAddress;
    const url = await this.paymentService.createVNPayUrl(orderId, ipAddr);
    return { url };
  }

  @Get('vnpay_return')
  @ApiOperation({ summary: 'VNPay Callback handle' })
  async vnpayCallback(@Query() query: any, @Res() res: Response) {
    const result = await this.paymentService.handleVNPayCallback(query);
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
    
    if (result.success) {
      return res.redirect(`${frontendUrl}/staff/billing?vnpay=success&order_id=${result.orderId}`);
    } else {
      return res.redirect(`${frontendUrl}/staff/billing?vnpay=failed&message=${result.message || 'error'}`);
    }
  }

  @Post('finalize')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Finalize Payment (EP28)' })
  finalize(@Body() finalizePaymentDto: FinalizePaymentDto) {
    return this.paymentService.finalize(finalizePaymentDto);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Process a new payment' })
  create(@Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentService.create(createPaymentDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all payments' })
  findAll() {
    return this.paymentService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get payment details by ID' })
  findOne(@Param('id') id: string) {
    return this.paymentService.findOne(BigInt(id));
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update payment status' })
  update(@Param('id') id: string, @Body() updatePaymentDto: UpdatePaymentDto) {
    return this.paymentService.update(BigInt(id), updatePaymentDto);
  }
}
