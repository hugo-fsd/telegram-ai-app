import { Elysia } from "elysia";
import { logger } from "../services/logger.service";
import { telegramService } from "../services/telegram.service";

export const telegramController = new Elysia()
	.get("/health", () => ({ status: "ok", timestamp: new Date().toISOString() }))
	.get("/sentry-test", () => {
		logger.info("Sentry test endpoint called");
		logger.warning("This is a test warning");
		logger.error(new Error("This is a test error"), { test: true });
		return { message: "Sentry test events sent! Check your Sentry dashboard." };
	})
	.post("/telegram/webhook", async ({ request }) => {
		logger.breadcrumb("Received webhook from Telegram");
		console.log("📨 Received webhook request from Telegram");
		
		try {
			const callback = telegramService.getWebhookCallback();
			return callback(request);
		} catch (error) {
			logger.error(error, { 
				endpoint: "/telegram/webhook",
				timestamp: new Date().toISOString() 
			});
			throw error;
		}
	});
