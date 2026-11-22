import { encryptQuantity } from "./security/crypto";
import { SafeErrors } from "./security/errors";
import "dotenv/config";
import { secureHttp } from "./security/http";
import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";

async function bootstrap() {
  encryptQuantity("0");
  const app = await NestFactory.create<import("@nestjs/platform-express").NestExpressApplication>(AppModule, { bodyParser: false });
  await secureHttp(app);
  app.useBodyParser("json", { limit: "32kb" });
  app.enableShutdownHooks();
  app.useGlobalFilters(new SafeErrors());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port, process.env.HOST ?? "0.0.0.0");
  console.log(`API escuchando en http://localhost:${port}`);
}
bootstrap();
