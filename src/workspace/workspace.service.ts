import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { NotificationService } from "../notification/notification.service";

@Injectable()
export class WorkspaceService {
  private readonly logger = new Logger(WorkspaceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationService,
  ) {}

  async create(userId: string, name: string) {
    const workspace = await this.prisma.workspace.create({
      data: {
        name,
        chat: { create: {} },
        members: {
          create: {
            userId,
            role: "owner",
          },
        },
      },
      include: {
        members: {
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
      },
    });

    this.logger.log(`Created workspace id=${workspace.id} name="${workspace.name}"`);
    return workspace;
  }

  async findAllForUser(userId: string) {
    return this.prisma.workspace.findMany({
      where: {
        members: {
          some: { userId },
        },
      },
      include: {
        members: {
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
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findOne(id: string, userId: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id },
      include: {
        members: {
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
      },
    });

    if (!workspace) {
      throw new NotFoundException("Workspace not found");
    }

    const isMember = workspace.members.some((m) => m.userId === userId);
    if (!isMember) {
      throw new ForbiddenException("You are not a member of this workspace");
    }

    return workspace;
  }

  async delete(workspaceId: string, userId: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { members: true },
    });

    if (!workspace) {
      throw new NotFoundException("Workspace not found");
    }

    const membership = workspace.members.find((m) => m.userId === userId);
    if (!membership || membership.role !== "owner") {
      throw new ForbiddenException("Only the owner can delete this workspace");
    }

    return this.prisma.workspace.delete({
      where: { id: workspaceId },
    });
  }

  async addMember(
    workspaceId: string,
    currentUserId: string,
    targetUserId: string,
  ) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { members: true },
    });

    if (!workspace) {
      throw new NotFoundException("Workspace not found");
    }

    const userMembership = workspace.members.find(
      (m) => m.userId === currentUserId,
    );
    if (!userMembership || userMembership.role !== "owner") {
      throw new ForbiddenException(
        "Only the owner can add members to this workspace",
      );
    }

    const existing = workspace.members.find(
      (m) => m.userId === targetUserId,
    );
    if (existing) {
      throw new ConflictException("User is already a member of this workspace");
    }

    const member = await this.prisma.workspaceMember.create({
      data: {
        userId: targetUserId,
        workspaceId,
        role: "member",
      },
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
    });

    const memberName = [member.user.firstName, member.user.lastName]
      .filter(Boolean)
      .join(" ") || member.user.name;

    await this.notifications.notifyWorkspaceMembers(
      workspaceId,
      targetUserId,
      "member_added",
      `${memberName} joined ${workspace.name}`,
    );

    return member;
  }

  async removeMember(
    workspaceId: string,
    currentUserId: string,
    targetUserId: string,
  ) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { members: true },
    });

    if (!workspace) {
      throw new NotFoundException("Workspace not found");
    }

    const userMembership = workspace.members.find(
      (m) => m.userId === currentUserId,
    );
    if (!userMembership || userMembership.role !== "owner") {
      throw new ForbiddenException(
        "Only the owner can remove members from this workspace",
      );
    }

    if (targetUserId === currentUserId) {
      throw new ForbiddenException(
        "You cannot remove yourself. Transfer ownership or delete the workspace instead.",
      );
    }

    const target = workspace.members.find(
      (m) => m.userId === targetUserId,
    );
    if (!target) {
      throw new NotFoundException("Member not found in this workspace");
    }

    return this.prisma.workspaceMember.delete({
      where: { id: target.id },
    });
  }
}
