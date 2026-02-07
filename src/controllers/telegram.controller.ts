import { Elysia } from "elysia";
import { logger } from "../services/logger.service";
import { telegramService } from "../services/telegram.service";

export const telegramController = new Elysia()
	.post("/telegram/webhook", async ({ request }) => {
		logger.breadcrumb("Received webhook from Telegram");
		
		try {
			const callback = telegramService.getWebhookCallback();
			// Process the webhook - grammy handles the response
			// We process it but don't block on it to prevent Telegram retries
			const response = await callback(request);
			return response;
		} catch (error) {
			logger.error(error, { 
				endpoint: "/telegram/webhook",
				timestamp: new Date().toISOString() 
			});
			// Return 200 to prevent retries, but log the error
			return new Response("OK", { status: 200 });
		}
	});
