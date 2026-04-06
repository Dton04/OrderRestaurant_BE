import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('orders')
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) { }

  @Post()
  // @UseGuards(JwtAuthGuard)
  // @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new order (Customer/Staff)' })
  create(@Body() createOrderDto: CreateOrderDto) {
    return this.orderService.create(createOrderDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all orders (Staff/Admin)' })
  findAll() {
    return this.orderService.findAll();
  }

  @Get('customer/my-orders')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Customer Order History' })
  findMyOrders(@Req() req: any, @Query('status') status?: string) {
    // req.user from JwtStrategy has userId
    const userId = req.user?.userId;
    return this.orderService.findMyOrders(BigInt(userId), status);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get an order by ID' })
  findOne(@Param('id') id: string) {
    return this.orderService.findOne(BigInt(id));
  }

  @Get('items/:item_id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Item Preparation Notes (Chef/Staff/Admin)' })
  getItemPreparationNotes(@Param('item_id') itemId: string) {
    return this.orderService.getItemPreparationNotes(BigInt(itemId));
  }

  @Get(':id/checkout-bill')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Pre-checkout Bill (Staff/Admin)' })
  getCheckoutBill(@Param('id') id: string) {
    return this.orderService.getCheckoutBill(BigInt(id));
  }

  @Get('chef/daily-summary')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Chef Daily Summary (Chef/Admin)' })
  getChefDailySummary() {
    return this.orderService.getChefDailySummary();
  }

  @Get('table/:table_id/active')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Find Active Order by Table (Staff/Admin)' })
  findActiveOrderByTableId(@Param('table_id') tableId: string) {
    return this.orderService.findActiveOrderByTableId(BigInt(tableId));
  }

  @Get('kitchen/queue')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Kitchen Queue (Chef/Admin)' })
  getKitchenQueue() {
    return this.orderService.getKitchenQueue();
  }

  @Get('staff/kitchen-pulse')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get completed dishes for Staff to serve' })
  getStaffKitchenPulse() {
    return this.orderService.getStaffKitchenPulse();
  }

  @Patch('items/:item_id/start')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Kitchen Start Cooking (Chef/Admin)' })
  startCooking(@Param('item_id') itemId: string) {
    return this.orderService.startCooking(BigInt(itemId));
  }

  @Patch('items/:item_id/finish')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Kitchen Finish Item (Chef/Admin)' })
  finishKitchenItem(@Param('item_id') itemId: string) {
    return this.orderService.finishKitchenItem(BigInt(itemId));
  }

  @Patch('items/:item_id/serve')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark Item as Served (Staff)' })
  serveItem(@Param('item_id') itemId: string) {
    return this.orderService.serveItem(BigInt(itemId));
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an order (Staff/Chef)' })
  update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto) {
    return this.orderService.update(BigInt(id), updateOrderDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel/Delete an order (Staff)' })
  remove(@Param('id') id: string) {
    return this.orderService.remove(BigInt(id));
  }

  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel entire order (Customer/Staff/Admin)' })
  cancel(@Param('id') id: string, @Body() cancelDto: CancelOrderDto) {
    return this.orderService.cancelOrder(BigInt(id), cancelDto);
  }

  @Patch(':id/items/:item_id/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel a specific order item (Customer/Staff/Admin)' })
  cancelItem(
    @Param('id') id: string,
    @Param('item_id') itemId: string,
    @Body() cancelDto: CancelOrderDto,
  ) {
    return this.orderService.cancelOrderItem(BigInt(id), BigInt(itemId), cancelDto);
  }
}
