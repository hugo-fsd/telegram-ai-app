import { Elysia } from "elysia";
import { telegramService } from "../services/telegram.service";

export const telegramController = new Elysia()
	.get("/health", () => ({ status: "ok", timestamp: new Date().toISOString() }))
	.post("/telegram/webhook", async ({ request }) => {
		console.log("📨 Received webhook request from Telegram");
		const callback = telegramService.getWebhookCallback();
		return callback(request);
	});
