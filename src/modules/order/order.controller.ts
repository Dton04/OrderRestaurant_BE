import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

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
    return this.orderService.findOne(BigInt(id));
  }

  @Get('items/:item_id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Item Preparation Notes (Chef/Staff/Admin)' })
  getItemPreparationNotes(@Param('item_id') itemId: string) {
    return this.orderService.getItemPreparationNotes(BigInt(itemId));
  }

  @Get('chef/daily-summary')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Chef Daily Summary (Chef/Admin)' })
  getChefDailySummary() {
    return this.orderService.getChefDailySummary();
  }

  @Get('kitchen/queue')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Kitchen Queue (Chef/Admin)' })
  getKitchenQueue() {
    return this.orderService.getKitchenQueue();
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
}
