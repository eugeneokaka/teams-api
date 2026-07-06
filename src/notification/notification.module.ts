import { Module, forwardRef } from "@nestjs/common";
import { ChatModule } from "../chat/chat.module";
import { NotificationService } from "./notification.service";
import { NotificationController } from "./notification.controller";

@Module({
  imports: [forwardRef(() => ChatModule)],
  controllers: [NotificationController],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
