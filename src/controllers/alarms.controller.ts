import { Elysia } from "elysia";
import { alarmService } from "../services/alarm.service";
import { logger } from "../services/logger.service";

export const alarmsController = new Elysia()
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
