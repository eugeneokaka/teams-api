import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import * as http from "http";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
  });

  const allowedOrigins = (process.env.CORS_ORIGINS ?? process.env.APP_URL ?? "http://localhost:3001")
    .split(",")
    .map((o) => o.trim());

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
