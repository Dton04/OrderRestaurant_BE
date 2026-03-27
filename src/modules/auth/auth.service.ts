import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  private issueRefreshToken(payload: { sub: string; email: string; role_id: string }) {
    return this.jwtService.sign(
      { ...payload, token_type: 'refresh' },
      {
        secret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'secretKey',
        expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN ?? '7d') as any,
      },
    );
  }

  async register(registerDto: RegisterDto) {
    const role = await this.userService.findRoleByName('CUSTOMER');
    if (!role) {
      throw new BadRequestException('Role CUSTOMER not found');
    }
    const user = await this.userService.create(registerDto, role.id);

    return {
      id: user.id.toString(),
      full_name: user.full_name,
      email: user.email,
      role: role.name,
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.userService.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.deleted_at) {
      throw new UnauthorizedException('Account locked');
    }
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: user.id.toString(),
      email: user.email,
      role_id: user.role_id.toString(),
    };

    return {
      access_token: this.jwtService.sign(payload),
      refresh_token: this.issueRefreshToken(payload),
      token_type: 'Bearer',
      user: {
        id: user.id.toString(),
        full_name: user.full_name,
        role: user.role?.name || 'UNKNOWN',
      },
    };
  }

  async getProfile(userId: bigint) {
    const user = await this.userService.findOne(userId);
    return {
      id: user.id.toString(),
      full_name: user.full_name,
      email: user.email,
      phone: user.phone,
      role: user.role?.name,
      points: user.points,
    };
  }
}
