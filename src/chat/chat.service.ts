import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getChatById(chatId: string) {
    return this.prisma.chat.findUnique({ where: { id: chatId } });
  }

  async getOrCreateWorkspaceChat(workspaceId: string, userId: string) {
    const membership = await this.prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId, workspaceId } },
    });
    if (!membership) {
      throw new ForbiddenException("You are not a member of this workspace");
    }

    let chat = await this.prisma.chat.findUnique({
      where: { workspaceId },
    });

    if (!chat) {
      chat = await this.prisma.chat.create({
        data: { workspaceId },
      });
    }

    return chat;
  }

  async getOrCreateTaskChat(taskId: string, userId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: { workspace: { include: { members: true } } },
    });

    if (!task) {
      throw new NotFoundException("Task not found");
    }

    const isMember = task.workspace.members.some((m) => m.userId === userId);
    if (!isMember) {
      throw new ForbiddenException("You are not a member of this workspace");
    }

    let chat = await this.prisma.chat.findUnique({
      where: { taskId },
    });

    if (!chat) {
      chat = await this.prisma.chat.create({
        data: { taskId },
      });
    }

    return chat;
  }

  async getMessages(chatId: string, cursor?: string) {
    const take = 50;

    const messages = await this.prisma.message.findMany({
      where: { chatId, parentId: null },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            email: true,
            image: true,
          },
        },
        replies: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                firstName: true,
                lastName: true,
                email: true,
                image: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
      take: cursor ? undefined : take,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
    });

    return messages.reverse();
  }

  async sendMessage(
    chatId: string,
    authorId: string,
    content: string,
    parentId?: string,
  ) {
    const chat = await this.prisma.chat.findUnique({ where: { id: chatId } });
    if (!chat) {
      throw new NotFoundException("Chat not found");
    }

    if (parentId) {
      const parent = await this.prisma.message.findUnique({
        where: { id: parentId },
      });
      if (!parent || parent.chatId !== chatId) {
        throw new NotFoundException("Parent message not found in this chat");
      }
    }

    const message = await this.prisma.message.create({
      data: { content, chatId, authorId, parentId: parentId ?? null },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            email: true,
            image: true,
          },
        },
        parent: {
          select: { id: true },
        },
      },
    });

    this.logger.log(
      `Created message id=${message.id} chatId=${chatId} authorId=${authorId} parentId=${parentId ?? "none"} content="${content.slice(0, 50)}"`,
    );
    return message;
  }

  async updateMessage(messageId: string, userId: string, content: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException("Message not found");
    }

    if (message.authorId !== userId) {
      throw new ForbiddenException("You can only edit your own messages");
    }

    return this.prisma.message.update({
      where: { id: messageId },
      data: { content },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            email: true,
            image: true,
          },
        },
      },
    });
  }

  async deleteMessage(messageId: string, userId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException("Message not found");
    }

    if (message.authorId !== userId) {
      throw new ForbiddenException("You can only delete your own messages");
    }

    await this.prisma.message.delete({ where: { id: messageId } });

    return { id: messageId, chatId: message.chatId };
  }
}
