import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { ChatGateway } from "../chat/chat.gateway";

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly chatGateway: ChatGateway,
  ) {}

  async create(data: {
    workspaceId: string;
    userId: string;
    type: string;
    title: string;
    body?: string;
  }) {
    const notification = await this.prisma.notification.create({
      data: {
        workspaceId: data.workspaceId,
        userId: data.userId,
        type: data.type,
        title: data.title,
        body: data.body,
      },
    });

    this.logger.log(
      `Created notification id=${notification.id} type=${data.type} userId=${data.userId}`,
    );

    this.chatGateway.emitNotification(data.userId, notification);

    return notification;
  }

  async notifyWorkspaceMembers(
    workspaceId: string,
    excludeUserId: string | null,
    type: string,
    title: string,
    body?: string,
  ) {
    const members = await this.prisma.workspaceMember.findMany({
      where: { workspaceId },
      select: { userId: true },
    });

    const createPromises = members
      .filter((m) => !excludeUserId || m.userId !== excludeUserId)
      .map((m) =>
        this.create({
          workspaceId,
          userId: m.userId,
          type,
          title,
          body,
        }),
      );

    return Promise.all(createPromises);
  }

  async findAllForUser(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }

  async countUnread(userId: string) {
    return this.prisma.notification.count({
      where: { userId, read: false },
    });
  }

  async markAsRead(id: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id, userId },
      data: { read: true },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  }
}
