import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Put('profile')
  @ApiOperation({ summary: 'Update Profile (EP4) ' })
  updateProfile(
    @Request() req: { user: { userId: string | number | bigint } },
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.userService.update(BigInt(req.user.userId), updateProfileDto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get()
  @ApiOperation({ summary: 'Admin Get Users (EP5)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'size', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  findAll(
    @Query('page') page: number = 1,
    @Query('size') size: number = 10,
    @Query('search') search?: string,
  ) {
    void page;
    void size;
    void search;
    return this.userService.findAll(); // Simple find all for now, pagination logic can be added later
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('staff')
  @ApiOperation({ summary: 'Admin Create Staff (EP6)' })
  createStaff(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto, createUserDto.role_id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Put(':id/status')
  @ApiOperation({ summary: 'Admin Toggle User Status (EP7)' })
  toggleStatus(@Param('id') id: string) {
    return this.userService.remove(BigInt(id));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user by ID' })
  findOne(@Param('id') id: string) {
    return this.userService.findOne(BigInt(id));
  }
}
