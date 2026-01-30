import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Global database module
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class DatabaseModule {}
