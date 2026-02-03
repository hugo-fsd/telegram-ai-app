import { Elysia } from "elysia";
import { env } from "./config/env";
import { database } from "./db";

await database.connect();

const { chatController } = await import("./controllers/chat.controller");
const { usersController } = await import("./controllers/users.controller");
const { telegramController } = await import("./controllers/telegram.controller");

const app = new Elysia().use(usersController).use(chatController).use(telegramController).listen(8080);

console.log(`🚀 Server running at ${app.server?.hostname}:${app.server?.port}`);

const { telegramService } = await import("./services/telegram.service");

if (env.TELEGRAM_WEBHOOK_URL) {
	const webhookUrl = `${env.TELEGRAM_WEBHOOK_URL}/telegram/webhook`;
	await telegramService.setWebhook(webhookUrl);
	console.log(`🤖 Telegram bot running in webhook mode: ${webhookUrl}`);
} else {
	await telegramService.startPolling();
	console.log("🤖 Telegram bot running in polling mode (local dev)");

	if (import.meta.hot) {
		import.meta.hot.dispose(() => {
			console.log("🔄 Hot reload detected - stopping bot...");
			telegramService.stop();
		});
	}
}
