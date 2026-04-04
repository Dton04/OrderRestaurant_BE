import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { VoucherService } from './voucher.service';

@ApiTags('vouchers')
@Controller('vouchers')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class VoucherController {
  constructor(private readonly voucherService: VoucherService) {}

  @Get()
  @ApiOperation({ summary: 'Get voucher list with search and status filter' })
  findAll(@Query('search') search?: string, @Query('status') status?: string) {
    return this.voucherService.findAll(search, status as any);
  }

  @Post()
  @ApiOperation({ summary: 'Create a voucher' })
  create(@Body() body: any) {
    return this.voucherService.create(body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a voucher' })
  update(@Param('id') id: string, @Body() body: any) {
    return this.voucherService.update(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a voucher' })
  remove(@Param('id') id: string) {
    return this.voucherService.remove(id);
  }
}
