import { Controller, Post, Get, Body, Req, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';
import type { Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sign-up')
  async signUp(
    @Body() body: { name: string; email: string; password: string },
  ) {
    return this.authService.signUp(body);
  }

  @Post('sign-in')
  @HttpCode(200)
  async signIn(
    @Body() body: { email: string; password: string; rememberMe?: boolean },
  ) {
    return this.authService.signIn(body);
  }

  @Get('session')
  async getSession(@Req() req: Request) {
    const headers = req.headers as Record<string, string>;
    return this.authService.getSession(headers);
  }

  @Post('sign-out')
  @HttpCode(200)
  async signOut(@Req() req: Request) {
    const headers = req.headers as Record<string, string>;
    return this.authService.signOut(headers);
  }
}
