import { Controller, Get, Patch, Param, Post } from "@nestjs/common";
import { Session } from "@thallesp/nestjs-better-auth";
import type { UserSession } from "@thallesp/nestjs-better-auth";
import { NotificationService } from "./notification.service";

@Controller("notifications")
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  async findAll(@Session() session: UserSession) {
    return this.notificationService.findAllForUser(session.user.id);
  }

  @Get("unread-count")
  async unreadCount(@Session() session: UserSession) {
    const count = await this.notificationService.countUnread(session.user.id);
    return { count };
  }

  @Patch(":id/read")
  async markAsRead(
    @Session() session: UserSession,
    @Param("id") id: string,
  ) {
    return this.notificationService.markAsRead(id, session.user.id);
  }

  @Post("read-all")
  async markAllAsRead(@Session() session: UserSession) {
    return this.notificationService.markAllAsRead(session.user.id);
  }
}
