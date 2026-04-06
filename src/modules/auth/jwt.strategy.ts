import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../user/user.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly userService: UserService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'secretKey',
    });
  }

  async validate(payload: unknown) {
    if (!payload || typeof payload !== 'object') {
      throw new UnauthorizedException();
    }

    const payloadRecord = payload as Record<string, unknown>;
    const sub = payloadRecord['sub'];
    if (
      typeof sub !== 'string' &&
      typeof sub !== 'number' &&
      typeof sub !== 'bigint'
    ) {
      throw new UnauthorizedException();
    }

    const user = await this.userService.findOne(BigInt(sub));
    if (!user) {
      throw new UnauthorizedException();
    }
    return {
      userId: sub,
      email: payloadRecord['email'],
      role_id: payloadRecord['role_id'],
    };
  }
}
