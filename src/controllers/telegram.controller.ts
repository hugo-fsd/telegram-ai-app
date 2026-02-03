import { Elysia } from "elysia";
import { telegramService } from "../services/telegram.service";

export const telegramController = new Elysia()
	.post("/telegram/webhook", async ({ request }) => {
		const callback = telegramService.getWebhookCallback();
		return callback(request);
	},
);
