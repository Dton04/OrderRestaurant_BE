import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { LoyaltyService } from './loyalty.service';

@ApiTags('loyalty')
@Controller('loyalty')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get loyalty rules, rewards and redemption history' })
  getDashboard() {
    return this.loyaltyService.getDashboard();
  }

  @Post('rules')
  @ApiOperation({ summary: 'Create loyalty point rule' })
  createRule(@Body() body: any) {
    return this.loyaltyService.createRule(body);
  }

  @Patch('rules/:id')
  @ApiOperation({ summary: 'Update loyalty point rule' })
  updateRule(@Param('id') id: string, @Body() body: any) {
    return this.loyaltyService.updateRule(id, body);
  }

  @Patch('rules/:id/deactivate')
  @ApiOperation({ summary: 'Deactivate loyalty point rule' })
  deactivateRule(@Param('id') id: string) {
    return this.loyaltyService.deactivateRule(id);
  }

  @Post('rewards')
  @ApiOperation({ summary: 'Create reward item' })
  createReward(@Body() body: any) {
    return this.loyaltyService.createReward(body);
  }

  @Patch('rewards/:id')
  @ApiOperation({ summary: 'Update reward item' })
  updateReward(@Param('id') id: string, @Body() body: any) {
    return this.loyaltyService.updateReward(id, body);
  }

  @Delete('rewards/:id')
  @ApiOperation({ summary: 'Delete reward item' })
  deleteReward(@Param('id') id: string) {
    return this.loyaltyService.deleteReward(id);
  }
}
