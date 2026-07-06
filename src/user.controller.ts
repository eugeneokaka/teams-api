import { Controller, Get, Query } from "@nestjs/common";
import { Session } from "@thallesp/nestjs-better-auth";
import type { UserSession } from "@thallesp/nestjs-better-auth";
import { PrismaService } from "./prisma/prisma.service";

@Controller("users")
export class UserController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("me")
  async getProfile(@Session() session: UserSession) {
    return { user: session.user };
  }

  @Get("search")
  async search(@Query("email") email: string) {
    if (!email) return [];

    return this.prisma.user.findMany({
      where: {
        email: { contains: email, mode: "insensitive" },
      },
      select: {
        id: true,
        name: true,
        firstName: true,
        lastName: true,
        email: true,
        image: true,
      },
      take: 10,
    });
  }
}
