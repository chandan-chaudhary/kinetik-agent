import {
  Controller,
  Post,
  Body,
  Req,
  Get,
  UseGuards,
  Res,
  Inject,
} from '@nestjs/common';
import type { Response } from 'express';
import type { AuthenticatedRequest } from '@/types/auth.types';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from '@nestjs/passport';
import { UpdatePasswordDto } from './dto/update-password.dto';
import type { ConfigType } from '@nestjs/config';
import authConfig from '@/config/auth.config';

function parseExpiryToMs(exp: string): number {
  if (!exp) return 3600000; // default 1 hour
  const v = exp.trim();
  // examples: '3600s', '1h', '15m', '3600000' (ms), '3600'
  if (/^\d+$/.test(v)) {
    // interpret as seconds
    return parseInt(v, 10) * 1000;
  }
  if (v.endsWith('ms')) {
    const n = parseInt(v.slice(0, -2), 10);
    return Number.isNaN(n) ? 3600000 : n;
  }
  if (v.endsWith('s')) {
    const n = parseInt(v.slice(0, -1), 10);
    return Number.isNaN(n) ? 3600000 : n * 1000;
  }
  if (v.endsWith('m')) {
    const n = parseInt(v.slice(0, -1), 10);
    return Number.isNaN(n) ? 3600000 : n * 60 * 1000;
  }
  if (v.endsWith('h')) {
    const n = parseInt(v.slice(0, -1), 10);
    return Number.isNaN(n) ? 3600000 : n * 60 * 60 * 1000;
  }
  return 3600000;
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    @Inject(authConfig.KEY)
    private readonly authConfigService: ConfigType<typeof authConfig>,
  ) {}

  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  getProfile(@Req() request: AuthenticatedRequest) {
    const user = request.user; // Contains payload from JwtStrategy.validate()
    return { user };
  }

  @Post('register')
  async register(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.register(registerDto);
    const jwtExpiry = this.authConfigService.jwtExpiresIn;
    const cookieMaxAge = parseExpiryToMs(jwtExpiry);
    res.cookie('access_token', result.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: cookieMaxAge,
      path: '/',
    });
    return result;
  }

  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(loginDto);
    const jwtExpiry = this.authConfigService.jwtExpiresIn;

    const cookieMaxAge = parseExpiryToMs(jwtExpiry);
    res.cookie('access_token', result.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: cookieMaxAge,
    });
    return result;
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('update-password')
  async updatePassword(
    @Body() updatePasswordDto: UpdatePasswordDto,
    @Req() request: AuthenticatedRequest,
  ) {
    const user = request.user!;
    return this.authService.updatePassword(user.userId, updatePasswordDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
    return { message: 'Logged out successfully' };
  }
}
