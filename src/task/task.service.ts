import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { ChatGateway } from "../chat/chat.gateway";
import { NotificationService } from "../notification/notification.service";

@Injectable()
export class TaskService {
  private readonly logger = new Logger(TaskService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly chatGateway: ChatGateway,
    private readonly notifications: NotificationService,
  ) {}

  async create(workspaceId: string, userId: string, title: string, assigneeId?: string, parentId?: string) {
    const membership = await this.prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId, workspaceId } },
    });

    if (!membership) {
      throw new ForbiddenException("You are not a member of this workspace");
    }

    if (assigneeId) {
      const assignee = await this.prisma.workspaceMember.findUnique({
        where: { id: assigneeId },
      });

      if (!assignee || assignee.workspaceId !== workspaceId) {
        throw new NotFoundException("Assignee not found in this workspace");
      }
    }

    if (parentId) {
      const parent = await this.prisma.task.findUnique({
        where: { id: parentId },
      });
      if (!parent || parent.workspaceId !== workspaceId) {
        throw new NotFoundException("Parent task not found in this workspace");
      }
    }

    const task = await this.prisma.task.create({
      data: {
        title,
        workspaceId,
        createdById: userId,
        assigneeId: assigneeId ?? null,
        parentId: parentId ?? null,
        chat: { create: {} },
      },
      include: {
        assignee: {
          include: {
            user: {
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
        },
        createdBy: {
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

    this.logger.log(
      `Created task id=${task.id} title="${task.title}" parentId=${task.parentId ?? "none"} workspaceId=${task.workspaceId}`,
    );
    this.chatGateway.emitTaskCreated(workspaceId, task);

    if (!task.parentId) {
      const workspace = await this.prisma.workspace.findUnique({
        where: { id: workspaceId },
        select: { name: true },
      });

      await this.notifications.notifyWorkspaceMembers(
        workspaceId,
        userId,
        "task_created",
        `New task: ${task.title}`,
        workspace?.name,
      );
    }

    return task;
  }

  async findOne(workspaceId: string, taskId: string, userId: string) {
    const membership = await this.prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId, workspaceId } },
    });

    if (!membership) {
      throw new ForbiddenException("You are not a member of this workspace");
    }

    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignee: {
          include: {
            user: {
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
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            email: true,
            image: true,
          },
        },
        children: {
          include: {
            assignee: {
              include: {
                user: {
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
            },
            createdBy: {
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
        chat: { select: { id: true } },
      },
    });

    if (!task || task.workspaceId !== workspaceId) {
      throw new NotFoundException("Task not found in this workspace");
    }

    return task;
  }

  async findAll(workspaceId: string, userId: string, parentId?: string) {
    const membership = await this.prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId, workspaceId } },
    });

    if (!membership) {
      throw new ForbiddenException("You are not a member of this workspace");
    }

    return this.prisma.task.findMany({
      where: {
        workspaceId,
        parentId: parentId ?? null,
      },
      include: {
        assignee: {
          include: {
            user: {
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
        },
        createdBy: {
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
    });
  }

  async update(
    workspaceId: string,
    taskId: string,
    userId: string,
    data: { title?: string; completed?: boolean; assigneeId?: string | null },
  ) {
    const membership = await this.prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId, workspaceId } },
    });

    if (!membership) {
      throw new ForbiddenException("You are not a member of this workspace");
    }

    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task || task.workspaceId !== workspaceId) {
      throw new NotFoundException("Task not found in this workspace");
    }

    this.logger.log(
      `update task=${taskId} userId=${userId} task.assigneeId=${task.assigneeId} data=${JSON.stringify(data)}`,
    );

    if (data.completed !== undefined) {
      if (task.assigneeId) {
        const assigneeMembership = await this.prisma.workspaceMember.findUnique({
          where: { id: task.assigneeId },
        });

        if (!assigneeMembership || assigneeMembership.userId !== userId) {
          throw new ForbiddenException(
            "Only the assignee can mark this task as completed",
          );
        }
      }
    }

    if (data.assigneeId !== undefined) {
      if (data.assigneeId !== null) {
        const assignee = await this.prisma.workspaceMember.findUnique({
          where: { id: data.assigneeId },
        });

        if (!assignee || assignee.workspaceId !== workspaceId) {
          throw new NotFoundException("Assignee not found in this workspace");
        }
      }
    }

    const updated = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.completed !== undefined && { completed: data.completed }),
        ...(data.assigneeId !== undefined && {
          assigneeId: data.assigneeId,
        }),
      },
      include: {
        assignee: {
          include: {
            user: {
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
        },
        createdBy: {
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

    this.chatGateway.emitTaskUpdated(workspaceId, updated);

    if (data.completed !== undefined) {
      const workspace = await this.prisma.workspace.findUnique({
        where: { id: workspaceId },
        select: { name: true },
      });

      await this.notifications.notifyWorkspaceMembers(
        workspaceId,
        userId,
        "task_completed",
        updated.completed
          ? `Task "${updated.title}" completed`
          : `Task "${updated.title}" reopened`,
        workspace?.name,
      );
    }

    return updated;
  }

  async remove(workspaceId: string, taskId: string, userId: string) {
    const membership = await this.prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId, workspaceId } },
    });

    if (!membership) {
      throw new ForbiddenException("You are not a member of this workspace");
    }

    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task || task.workspaceId !== workspaceId) {
      throw new NotFoundException("Task not found in this workspace");
    }

    await this.prisma.task.delete({ where: { id: taskId } });
    this.chatGateway.emitTaskDeleted(workspaceId, taskId);
    return { id: taskId };
  }
}
