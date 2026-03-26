import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ChatSessionService,
  type CreateSessionDto,
  type UpdateSessionDto,
} from './chat-session.service';
import type { AuthenticatedRequest } from '@/types/auth.types';

@UseGuards(AuthGuard('jwt'))
@Controller('chat-sessions')
export class ChatSessionController {
  constructor(private readonly chatSessionService: ChatSessionService) {}

  @Post()
  create(@Body() dto: CreateSessionDto, @Req() req: AuthenticatedRequest) {
    return this.chatSessionService.create(req.user!.userId, dto);
  }

  @Get()
  findAll(@Req() req: AuthenticatedRequest) {
    return this.chatSessionService.findAll(req.user!.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.chatSessionService.findOne(id, req.user!.userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateSessionDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.chatSessionService.update(id, req.user!.userId, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.chatSessionService.remove(id, req.user!.userId);
  }
}
