import { Module, forwardRef } from "@nestjs/common";
import { TaskController } from "./task.controller";
import { TaskService } from "./task.service";
import { ChatModule } from "../chat/chat.module";
import { NotificationModule } from "../notification/notification.module";

@Module({
  imports: [ChatModule, forwardRef(() => NotificationModule)],
  controllers: [TaskController],
  providers: [TaskService],
})
export class TaskModule {}
