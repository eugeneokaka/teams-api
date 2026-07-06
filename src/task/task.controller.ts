import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Logger,
} from "@nestjs/common";
import { Session } from "@thallesp/nestjs-better-auth";
import type { UserSession } from "@thallesp/nestjs-better-auth";
import { TaskService } from "./task.service";

@Controller("workspaces/:workspaceId/tasks")
export class TaskController {
  private readonly logger = new Logger(TaskController.name);

  constructor(private readonly taskService: TaskService) {}

  @Post()
  async create(
    @Session() session: UserSession,
    @Param("workspaceId") workspaceId: string,
    @Body("title") title: string,
    @Body("assigneeId") assigneeId?: string,
    @Body("parentId") parentId?: string,
  ) {
    this.logger.log(`POST ${workspaceId} title="${title}" assigneeId=${assigneeId} parentId=${parentId}`);
    return this.taskService.create(
      workspaceId,
      session.user.id,
      title,
      assigneeId,
      parentId,
    );
  }

  @Get()
  async findAll(
    @Session() session: UserSession,
    @Param("workspaceId") workspaceId: string,
    @Query("parentId") parentId?: string,
  ) {
    this.logger.log(`GET ${workspaceId} parentId=${parentId}`);
    return this.taskService.findAll(workspaceId, session.user.id, parentId ?? undefined);
  }

  @Get(":id")
  async findOne(
    @Session() session: UserSession,
    @Param("workspaceId") workspaceId: string,
    @Param("id") id: string,
  ) {
    this.logger.log(`GET ${workspaceId}/${id}`);
    return this.taskService.findOne(workspaceId, id, session.user.id);
  }

  @Patch(":id")
  async update(
    @Session() session: UserSession,
    @Param("workspaceId") workspaceId: string,
    @Param("id") id: string,
    @Body() body: { title?: string; completed?: boolean; assigneeId?: string | null },
  ) {
    this.logger.log(
      `PATCH ${workspaceId}/${id} body=${JSON.stringify(body)}`,
    );
    try {
      const result = await this.taskService.update(
        workspaceId,
        id,
        session.user.id,
        body,
      );
      this.logger.log(
        `PATCH ${workspaceId}/${id} OK`,
      );
      return result;
    } catch (err: unknown) {
      this.logger.error(
        `PATCH ${workspaceId}/${id} FAILED: ${(err as Error).message}`,
      );
      throw err;
    }
  }

  @Delete(":id")
  async remove(
    @Session() session: UserSession,
    @Param("workspaceId") workspaceId: string,
    @Param("id") id: string,
  ) {
    this.logger.log(`DELETE ${workspaceId}/${id}`);
    return this.taskService.remove(workspaceId, id, session.user.id);
  }
}
