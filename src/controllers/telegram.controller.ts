import { Elysia } from "elysia";
import { alarmService } from "../services/alarm.service";
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
	})
	.get("/alarms/trigger/:alarmId", async ({ params }) => {
		const { alarmId } = params;
		console.log("Alarm trigger webhook received", { alarmId });
		logger.info("Alarm trigger webhook received", { alarmId });
		
		try {
			await alarmService.triggerAlarm(alarmId);
			return { status: "ok", message: "Alarm triggered" };
		} catch (error) {
			logger.error(error, { 
				endpoint: "/alarms/trigger",
				alarmId 
			});
			return { status: "error", message: "Failed to trigger alarm" };
		}
	});
