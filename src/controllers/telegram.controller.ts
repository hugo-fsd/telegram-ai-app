import { Elysia } from "elysia";
import { logger } from "../services/logger.service";
import { telegramService } from "../services/telegram.service";

export const telegramController = new Elysia()
	.post("/telegram/webhook", async ({ request }) => {
		logger.breadcrumb("Received webhook from Telegram");
		
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
