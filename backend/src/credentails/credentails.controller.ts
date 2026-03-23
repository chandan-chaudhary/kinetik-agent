import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CredentailsService } from './credentails.service';
import { AuthGuard } from '@nestjs/passport';
import type { AuthenticatedRequest } from '@/types/auth.types';
import { CredentialType, Prisma } from '@prisma/client';

@UseGuards(AuthGuard('jwt'))
@Controller('credentials')
export class CredentailsController {
  constructor(private readonly credentailsService: CredentailsService) {}

  @Post()
  create(
    @Body() createCredentailDto: Prisma.CredentialCreateInput,
    @Req() request: AuthenticatedRequest,
  ) {
    const userId = request.user?.userId as string;
    return this.credentailsService.create(userId, createCredentailDto);
  }

  @Get()
  findAll(
    @Req() request: AuthenticatedRequest,
    @Query('type') type?: CredentialType,
  ) {
    const userId = request.user?.userId as string;
    return this.credentailsService.findAll(userId, type);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    const userId = request.user?.userId as string;
    return this.credentailsService.findOne(id, userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateCredentailDto: Prisma.CredentialUpdateInput,
    @Req() request: AuthenticatedRequest,
  ) {
    const userId = request.user?.userId as string;
    return this.credentailsService.update(id, userId, updateCredentailDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    const userId = request.user?.userId as string;
    return this.credentailsService.remove(id, userId);
  }
}
