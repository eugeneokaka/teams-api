import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthModule as BetterAuthModule } from "@thallesp/nestjs-better-auth";
import { auth } from "../lib/auth";
import { PrismaModule } from "./prisma/prisma.module";
import { UserCreateHook } from "./hooks/user-create.hook";
import { WorkspaceModule } from "./workspace/workspace.module";
import { TaskModule } from "./task/task.module";
import { ChatModule } from "./chat/chat.module";
import { NotificationModule } from "./notification/notification.module";
import { UserController } from "./user.controller";
@Module({
  imports: [BetterAuthModule.forRoot({ auth }), PrismaModule, WorkspaceModule, TaskModule, ChatModule, NotificationModule],
  controllers: [AppController, UserController],
  providers: [AppService, UserCreateHook],
})
export class AppModule {}
