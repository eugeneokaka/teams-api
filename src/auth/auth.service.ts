import { Injectable } from '@nestjs/common';
import { auth } from '../../lib/auth';

@Injectable()
export class AuthService {
  private get api() {
    return auth.api;
  }

  async signUp(body: { name: string; email: string; password: string }) {
    console.log('[auth.service] signUp called with email:', body.email);
    try {
      const result = await this.api.signUpEmail({ body });
      console.log('[auth.service] signUp result:', JSON.stringify(result, null, 2));
      return result;
    } catch (error) {
      console.error('[auth.service] signUp error:', error);
      throw error;
    }
  }

  async signIn(body: { email: string; password: string; rememberMe?: boolean }) {
    console.log('[auth.service] signIn called with email:', body.email);
    try {
      const result = await this.api.signInEmail({ body });
      console.log('[auth.service] signIn result:', JSON.stringify(result, null, 2));
      return result;
    } catch (error) {
      console.error('[auth.service] signIn error:', error);
      throw error;
    }
  }

  async signOut(headers: Record<string, string>) {
    return this.api.signOut({ headers });
  }

  async getSession(headers: Record<string, string>) {
    return this.api.getSession({ headers });
  }
}
