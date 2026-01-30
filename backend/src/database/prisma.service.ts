import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  // Optionally, you can set the log level here
  private readonly logger = new Logger(PrismaService.name);
  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Prisma Client connected successfully');
    } catch (error) {
      this.logger.error('Error connecting to Prisma Client', error);
      throw new Error('Could not connect to Prisma Client');
    }
  }

  // Optionally, add a method to handle disconnect when shutting down the app
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
