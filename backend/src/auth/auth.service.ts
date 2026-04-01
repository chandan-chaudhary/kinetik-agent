import { Injectable, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createError, customError, ERROR_CODE } from '@/common/customError';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<{ access_token: string }> {
    try {
      const { email, name, password } = registerDto;

      // Check if user already exists
      const existingUser = await this.prisma.user.findUnique({
        where: { email },
      });
      if (existingUser) {
        throw createError('User already exists', {
          code: ERROR_CODE.CONFLICT,
          httpStatus: HttpStatus.CONFLICT,
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await this.prisma.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
        },
      });

      // Generate JWT
      const payload = { email: user.email, sub: user.id };
      const access_token = this.jwtService.sign(payload);

      return { access_token };
    } catch (error) {
      throw customError(error, {
        fallbackStatus: HttpStatus.INTERNAL_SERVER_ERROR,
        fallbackMessage: 'Registration failed',
      });
    }
  }

  async login(loginDto: LoginDto): Promise<{ access_token: string }> {
    try {
      const { email, password } = loginDto;

      // Find user
      const user = await this.prisma.user.findUnique({
        where: { email },
      });
      if (!user) {
        throw createError('Invalid credentials', {
          code: ERROR_CODE.UNAUTHORIZED,
          httpStatus: HttpStatus.UNAUTHORIZED,
        });
      }

      // Compare password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw createError('Invalid credentials', {
          code: ERROR_CODE.UNAUTHORIZED,
          httpStatus: HttpStatus.UNAUTHORIZED,
        });
      }

      // Generate JWT
      const payload = { email: user.email, sub: user.id };
      const access_token = this.jwtService.sign(payload);

      // instead retrun the message with login success
      return { access_token };
    } catch (error) {
      throw customError(error, {
        fallbackStatus: HttpStatus.INTERNAL_SERVER_ERROR,
        fallbackMessage: 'Login failed',
      });
    }
  }

  async updatePassword(
    userId: string,
    updatePasswordDto: UpdatePasswordDto,
  ): Promise<{ message: string }> {
    try {
      const { currentPassword, newPassword } = updatePasswordDto;

      // Find user
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });
      if (!user) {
        throw createError('User not found', {
          code: ERROR_CODE.NOT_FOUND,
          httpStatus: HttpStatus.NOT_FOUND,
        });
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(
        currentPassword,
        user.password,
      );
      if (!isCurrentPasswordValid) {
        throw createError('Current password is incorrect', {
          code: ERROR_CODE.UNAUTHORIZED,
          httpStatus: HttpStatus.UNAUTHORIZED,
        });
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      await this.prisma.user.update({
        where: { id: userId },
        data: { password: hashedNewPassword },
      });

      return { message: 'Password updated successfully' };
    } catch (error) {
      throw customError(error, {
        fallbackStatus: HttpStatus.INTERNAL_SERVER_ERROR,
        fallbackMessage: 'Failed to update password',
      });
    }
  }

  async deleteAccount(userId: string): Promise<{ message: string }> {
    try {
      const existingUser = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!existingUser) {
        throw createError('User not found', {
          code: ERROR_CODE.NOT_FOUND,
          httpStatus: HttpStatus.NOT_FOUND,
        });
      }

      await this.prisma.user.delete({
        where: { id: userId },
      });

      return { message: 'Account deleted successfully' };
    } catch (error) {
      throw customError(error, {
        fallbackStatus: HttpStatus.INTERNAL_SERVER_ERROR,
        fallbackMessage: 'Failed to delete account',
      });
    }
  }
}
