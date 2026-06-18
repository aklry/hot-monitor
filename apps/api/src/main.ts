import "reflect-metadata"
import { ConfigService } from "@nestjs/config"
import { NestFactory } from "@nestjs/core"
import { AppModule } from "./app.module"

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const config = app.get(ConfigService)
  const origin = config.get<string>("WEB_ORIGIN") ?? "http://localhost:5173"
  app.enableCors({ credentials: true, origin })
  const port = Number(config.get("API_PORT") ?? 4000)
  await app.listen(port)
}

void bootstrap()
