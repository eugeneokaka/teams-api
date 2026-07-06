import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { Injectable, Logger, Inject, forwardRef } from "@nestjs/common";
import { auth } from "../../lib/auth";
import { ChatService } from "./chat.service";
import { NotificationService } from "../notification/notification.service";

@Injectable()
@WebSocketGateway({
  cors: {
    origin: process.env.APP_URL ?? "http://localhost:3001",
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly chatService: ChatService,
    @Inject(forwardRef(() => NotificationService))
    private readonly notifications: NotificationService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const cookie = client.handshake.headers.cookie;
      if (!cookie) {
        this.logger.warn("No cookie in handshake");
        client.disconnect();
        return;
      }

      const session = await auth.api.getSession({
        headers: new Headers({ cookie }),
      });

      if (!session?.user) {
        this.logger.warn("Invalid session");
        client.disconnect();
        return;
      }

      client.data.userId = session.user.id;
      client.data.user = {
        id: session.user.id,
        name: session.user.name,
        firstName: session.user.firstName,
        lastName: session.user.lastName,
        email: session.user.email,
        image: session.user.image,
      };

      client.join(`user:${session.user.id}`);

      this.logger.log(`Client connected: ${session.user.id}`);
    } catch (err) {
      this.logger.error("Connection error", err);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.data?.userId}`);
  }

  @SubscribeMessage("chat:join")
  async handleJoinChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string },
  ) {
    client.join(`chat:${data.chatId}`);
    this.logger.log(
      `User ${client.data.userId} joined chat:${data.chatId}`,
    );
  }

  @SubscribeMessage("workspace:join")
  async handleJoinWorkspace(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { workspaceId: string },
  ) {
    client.join(`workspace:${data.workspaceId}`);
    this.logger.log(
      `User ${client.data.userId} joined workspace:${data.workspaceId}`,
    );
  }

  @SubscribeMessage("workspace:leave")
  async handleLeaveWorkspace(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { workspaceId: string },
  ) {
    client.leave(`workspace:${data.workspaceId}`);
  }

  @SubscribeMessage("chat:leave")
  async handleLeaveChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string },
  ) {
    client.leave(`chat:${data.chatId}`);
  }

  @SubscribeMessage("user:join")
  async handleJoinUser(@ConnectedSocket() client: Socket) {
    client.join(`user:${client.data.userId}`);
    this.logger.log(`User ${client.data.userId} joined personal room`);
  }

  @SubscribeMessage("chat:send")
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: { chatId: string; content: string; parentId?: string },
  ) {
    this.logger.log(
      `WS chat:send userId=${client.data.userId} chatId=${data.chatId} parentId=${data.parentId ?? "none"}`,
    );
    try {
      const message = await this.chatService.sendMessage(
        data.chatId,
        client.data.userId,
        data.content,
        data.parentId,
      );

      this.server.to(`chat:${data.chatId}`).emit("chat:message", message);

      if (message.chatId) {
        const chat = await this.chatService.getChatById(data.chatId);
        if (chat) {
          const workspaceId = chat.workspaceId;
          if (workspaceId) {
            const authorName =
              [message.author.firstName, message.author.lastName]
                .filter(Boolean)
                .join(" ") || message.author.name;

            this.notifications.notifyWorkspaceMembers(
              workspaceId,
              client.data.userId,
              "message_sent",
              authorName ? `${authorName} sent a message` : "New message",
              message.content.slice(0, 100),
            );
          }
        }
      }

      return { success: true, message };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to send message",
      };
    }
  }

  @SubscribeMessage("chat:edit")
  async handleEditMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string; content: string },
  ) {
    try {
      const message = await this.chatService.updateMessage(
        data.messageId,
        client.data.userId,
        data.content,
      );

      this.server.to(`chat:${message.chatId}`).emit("chat:updated", message);

      return { success: true, message };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to edit message",
      };
    }
  }

  @SubscribeMessage("chat:delete")
  async handleDeleteMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string },
  ) {
    try {
      const result = await this.chatService.deleteMessage(
        data.messageId,
        client.data.userId,
      );

      this.server
        .to(`chat:${result.chatId}`)
        .emit("chat:deleted", { messageId: result.id, chatId: result.chatId });

      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to delete message",
      };
    }
  }

  emitTaskCreated(workspaceId: string, task: unknown) {
    this.server.to(`workspace:${workspaceId}`).emit("task:created", task);
  }

  emitTaskUpdated(workspaceId: string, task: unknown) {
    this.server.to(`workspace:${workspaceId}`).emit("task:updated", task);
  }

  emitTaskDeleted(workspaceId: string, taskId: string) {
    this.server
      .to(`workspace:${workspaceId}`)
      .emit("task:deleted", { taskId, workspaceId });
  }

  emitNotification(userId: string, notification: unknown) {
    this.server.to(`user:${userId}`).emit("notification:new", notification);
  }
}
