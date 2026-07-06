import { Controller, Get, Param, Query, Req } from "@nestjs/common";
import { Session } from "@thallesp/nestjs-better-auth";
import type { UserSession } from "@thallesp/nestjs-better-auth";
import { ChatService } from "./chat.service";

@Controller()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get("workspaces/:workspaceId/chat")
  async getWorkspaceChat(
    @Param("workspaceId") workspaceId: string,
    @Session() session: UserSession,
  ) {
    const chat = await this.chatService.getOrCreateWorkspaceChat(
      workspaceId,
      session.user.id,
    );
    const messages = await this.chatService.getMessages(chat.id);
    return { chat, messages };
  }

  @Get("tasks/:taskId/chat")
  async getTaskChat(
    @Param("taskId") taskId: string,
    @Session() session: UserSession,
  ) {
    const chat = await this.chatService.getOrCreateTaskChat(
      taskId,
      session.user.id,
    );
    const messages = await this.chatService.getMessages(chat.id);
    return { chat, messages };
  }

  @Get("chat/:chatId/messages")
  async getMessages(
    @Param("chatId") chatId: string,
    @Query("cursor") cursor?: string,
  ) {
    return this.chatService.getMessages(chatId, cursor);
  }
}
