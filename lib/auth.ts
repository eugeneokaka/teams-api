import "dotenv/config";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import { sendEmail } from "./email";

console.log("[auth] BETTER_AUTH_URL:", process.env.BETTER_AUTH_URL);
console.log("[auth] APP_URL:", process.env.APP_URL);
console.log("[auth] EMAIL_FROM:", process.env.EMAIL_FROM);
console.log("[auth] RESEND_API_KEY set:", !!process.env.RESEND_API_KEY);

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      console.log("[auth] sendResetPassword called for:", user.email);
      console.log("[auth] reset URL:", url);
      void sendEmail({
        to: user.email,
        subject: "Reset your password",
        text: `Click the link to reset your password: ${url}`,
        html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#f9f9f9;border-radius:8px;">
          <h2 style="margin:0 0 16px;font-size:20px;">Reset your password</h2>
          <p style="margin:0 0 24px;color:#555;font-size:15px;line-height:1.5;">
            We received a request to reset your password. Click the button below to set a new one.
          </p>
          <a href="${url}" style="display:inline-block;padding:12px 24px;background:#18181b;color:#fff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:500;">
            Reset Password →
          </a>
          <p style="margin:24px 0 0;color:#888;font-size:13px;">
            If you didn't request this, you can safely ignore this email.
          </p>
        </div>`,
      }).catch((err) => console.error("[auth] sendResetPassword failed:", err));
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      console.log("[auth] sendVerificationEmail called for:", user.email);
      console.log("[auth] verification URL:", url);
      void sendEmail({
        to: user.email,
        subject: "Verify your email address",
        text: `Click the link to verify your email: ${url}`,
        html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#f9f9f9;border-radius:8px;">
          <h2 style="margin:0 0 16px;font-size:20px;">Verify your email</h2>
          <p style="margin:0 0 24px;color:#555;font-size:15px;line-height:1.5;">
            Thanks for signing up! Click the button below to verify your email address and activate your account.
          </p>
          <a href="${url}" style="display:inline-block;padding:12px 24px;background:#18181b;color:#fff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:500;">
            Verify Email →
          </a>
          <p style="margin:24px 0 0;color:#888;font-size:13px;">
            If you didn't create an account, you can safely ignore this email.
          </p>
        </div>`,
      }).catch((err) => console.error("[auth] sendVerificationEmail failed:", err));
    },
  },
  trustedOrigins: [process.env.APP_URL ?? "http://localhost:3001"],
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
});
