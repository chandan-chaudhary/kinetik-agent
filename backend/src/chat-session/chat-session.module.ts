import { Module } from '@nestjs/common';
import { ChatSessionService } from './chat-session.service';
import { ChatSessionController } from './chat-session.controller';

@Module({
  controllers: [ChatSessionController],
  providers: [ChatSessionService],
})
export class ChatSessionModule {}

// import { Module } from '@nestjs/common';
// import { ChatSessionService } from './chat-session.service';
// import { ChatSessionController } from './chat-session.controller';

// @Module({
//   controllers: [ChatSessionController],
//   providers: [ChatSessionService],
//   exports: [ChatSessionService],
// })
// export class ChatSessionModule {}