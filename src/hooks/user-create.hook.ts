import { Injectable } from "@nestjs/common";
import { DatabaseHook, BeforeCreate } from "@thallesp/nestjs-better-auth";

@DatabaseHook()
@Injectable()
export class UserCreateHook {
  @BeforeCreate("user")
  async beforeUserCreate(user: Record<string, unknown>) {
    if (!user.firstName || !user.lastName) {
      const name = user.name as string | undefined;
      const parts = name?.split(" ") ?? [];
      return {
        data: {
          ...user,
          firstName: user.firstName || parts[0] || "",
          lastName: user.lastName || parts.slice(1).join(" ") || "",
        },
      };
    }
  }
}
