import * as Sentry from "@sentry/bun";
import { Elysia } from "elysia";
import { env } from "./config/env";
import { database } from "./db";
import { logger } from "./services/logger.service";

Sentry.init({
	dsn: env.SENTRY_DSN,
	environment: env.NODE_ENV,
	tracesSampleRate: 1.0,
	enableLogs: true,
});

logger.info("Sentry initialized");

await database.connect();

const { healthController } = await import("./controllers/health.controller");
const { alarmsController } = await import("./controllers/alarms.controller");
const { telegramController } = await import("./controllers/telegram.controller");

const app = new Elysia()
	.use(healthController)
	.use(alarmsController)
	.use(telegramController)
	.listen({
		hostname: "0.0.0.0",
		port: env.PORT,
	});

logger.info(`Server running at ${app.server?.hostname}:${app.server?.port}`);
const { telegramService } = await import("./services/telegram.service");

await telegramService.removeWebhook();
await new Promise(resolve => setTimeout(resolve, 1000));
await telegramService.setWebhook(env.TELEGRAM_WEBHOOK_URL);

if (import.meta.hot) {
	import.meta.hot.dispose(async () => {
		logger.info("Hot reload detected - stopping bot");
		await telegramService.removeWebhook();
		await telegramService.stop();
	});
}

console.log("App running at", env.PORT);
console.log("Connected to MongoDB", env.MONGODB_DB_NAME);
console.log("Connected to Telegram", env.TELEGRAM_WEBHOOK_URL);
console.log("Connected to Cronjob", env.CRONJOB_WEBHOOK_URL);
