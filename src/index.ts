import { Elysia } from "elysia";
import { env } from "./config/env";
import { database } from "./db";

await database.connect();

const { telegramController } = await import("./controllers/telegram.controller");

const app = new Elysia().use(telegramController).listen(8080);

console.log(`🚀 Server running at ${app.server?.hostname}:${app.server?.port}`);

const { telegramService } = await import("./services/telegram.service");

await telegramService.removeWebhook();
await new Promise(resolve => setTimeout(resolve, 1000));
await telegramService.setWebhook(env.TELEGRAM_WEBHOOK_URL);

if (import.meta.hot) {
	import.meta.hot.dispose(async () => {
		console.log("🔄 Hot reload detected - stopping bot...");
		await telegramService.removeWebhook();
		await telegramService.stop();
	});
}
