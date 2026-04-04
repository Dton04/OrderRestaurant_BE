import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { OrderStatus } from '../../generated/prisma/client';

@ApiTags('orders')
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new order (Customer/Staff)' })
  create(@Body() createOrderDto: CreateOrderDto) {
    return this.orderService.create(createOrderDto);
  }

  @Get('active')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(4) // Assuming 4 is the Chef Role ID
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all active orders (Chef)' })
  findActiveOrders() {
    return this.orderService.findActiveOrders();
  }

  @Get('history')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(4) // Assuming 4 is the Chef Role ID
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get historical completed orders (Chef)' })
  findHistoryOrders() {
    return this.orderService.findHistoryOrders();
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all orders (Staff/Admin)' })
  findAll() {
    return this.orderService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an order by ID' })
  findOne(@Param('id') id: string) {
    try {
      return this.orderService.findOne(BigInt(id));
    } catch {
      throw new BadRequestException('Invalid Order ID format');
    }
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an order (Staff/Chef)' })
  update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto) {
    try {
      return this.orderService.update(BigInt(id), updateOrderDto);
    } catch {
      throw new BadRequestException('Invalid Order ID format');
    }
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(4) // Assuming 4 is the Chef Role ID
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an order status (Chef)' })
  @ApiBody({ schema: { example: { status: 'READY' } } })
  updateOrderStatus(
    @Param('id') id: string,
    @Body('status') status: OrderStatus,
  ) {
    try {
      return this.orderService.updateOrderStatus(BigInt(id), status);
    } catch {
      throw new BadRequestException('Invalid Order ID format');
    }
  }

  @Patch(':orderId/items/:itemId/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(4) // Assuming 4 is the Chef Role ID
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an order item status (Chef)' })
  @ApiBody({ schema: { example: { status: 'PREPARING' } } })
  updateItemStatus(
    @Param('orderId') orderId: string,
    @Param('itemId') itemId: string,
    @Body('status') status: OrderStatus,
  ) {
    try {
      return this.orderService.updateOrderItemStatus(BigInt(orderId), BigInt(itemId), status);
    } catch {
      throw new BadRequestException('Invalid ID format');
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel/Delete an order (Staff)' })
  remove(@Param('id') id: string) {
    try {
      return this.orderService.remove(BigInt(id));
    } catch {
      throw new BadRequestException('Invalid Order ID format');
    }
  }
}
