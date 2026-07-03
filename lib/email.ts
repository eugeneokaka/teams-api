import "dotenv/config";
import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
console.log("[email] Resend API key loaded:", apiKey ? `${apiKey.substring(0, 8)}...` : "MISSING");

const resend = new Resend(apiKey!);

const fromDomain = process.env.EMAIL_FROM ?? "noreply@yourdomain.com";
console.log("[email] From domain:", fromDomain);

export async function sendEmail({
  to,
  subject,
  text,
  html,
}: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}) {
  console.log("[email] Attempting to send email:", { to, subject, from: fromDomain });
  try {
    const result = await resend.emails.send({
      from: fromDomain,
      to,
      subject,
      text,
      html,
    });
    console.log("[email] Email sent successfully:", JSON.stringify(result));
    return result;
  } catch (error) {
    console.error("[email] Failed to send email:");
    console.error("[email]   Error name:", (error as any)?.name);
    console.error("[email]   Error message:", (error as any)?.message);
    console.error("[email]   Error statusCode:", (error as any)?.statusCode);
    console.error("[email]   Full error:", error);
    throw error;
  }
}
