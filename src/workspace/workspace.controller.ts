import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
} from "@nestjs/common";
import { Session } from "@thallesp/nestjs-better-auth";
import type { UserSession } from "@thallesp/nestjs-better-auth";
import { WorkspaceService } from "./workspace.service";

@Controller("workspaces")
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  @Post()
  async create(
    @Session() session: UserSession,
    @Body("name") name: string,
  ) {
    return this.workspaceService.create(session.user.id, name);
  }

  @Get()
  async findAll(@Session() session: UserSession) {
    return this.workspaceService.findAllForUser(session.user.id);
  }

  @Get(":id")
  async findOne(
    @Session() session: UserSession,
    @Param("id") id: string,
  ) {
    return this.workspaceService.findOne(id, session.user.id);
  }

  @Delete(":id")
  async remove(
    @Session() session: UserSession,
    @Param("id") id: string,
  ) {
    return this.workspaceService.delete(id, session.user.id);
  }

  @Post(":id/members")
  async addMember(
    @Session() session: UserSession,
    @Param("id") workspaceId: string,
    @Body("userId") userId: string,
  ) {
    return this.workspaceService.addMember(
      workspaceId,
      session.user.id,
      userId,
    );
  }

  @Delete(":id/members/:userId")
  async removeMember(
    @Session() session: UserSession,
    @Param("id") workspaceId: string,
    @Param("userId") userId: string,
  ) {
    return this.workspaceService.removeMember(
      workspaceId,
      session.user.id,
      userId,
    );
  }
}
