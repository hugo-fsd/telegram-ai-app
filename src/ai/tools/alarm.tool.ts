import { tool } from "ai";
import { z } from "zod";
import { alarmService } from "../../services/alarm.service";
import { logger } from "../../services/logger.service";

let currentUserId: string | null = null;

export const setAlarmToolContext = (userId: string) => {
	currentUserId = userId;
};

export const alarmTool = tool({
	description: `Create an alarm, reminder, or scheduled notification for the user. 
	Use this when the user asks to:
	- Set an alarm
	- Create a reminder
	- Schedule a notification
	- Set a timer
	- Remember something at a specific time
	
	IMPORTANT: Use the current date and time from the system context to determine the correct values.
	Provide specific numeric values for the schedule. Use null/undefined for fields that should match any value (wildcards).
	
	Examples:
	- One-time alarm today at 2:30 PM: minute=30, hour=14, day=currentDay, month=currentMonth, dayOfWeek=null
	- One-time alarm on Feb 7 at 2:30 PM: minute=30, hour=14, day=7, month=2, dayOfWeek=null
	- Every day at 9 AM: minute=0, hour=9, day=null, month=null, dayOfWeek=null
	- Every Monday at 8 AM: minute=0, hour=8, day=null, month=null, dayOfWeek=1
	- Every hour: minute=0, hour=null, day=null, month=null, dayOfWeek=null
	
	Field meanings:
	- minute: 0-59 (specific minute, or null for any minute)
	- hour: 0-23 (specific hour in 24-hour format, or null for any hour)
	- day: 1-31 (day of month, or null for any day)
	- month: 1-12 (month number, or null for any month)
	- dayOfWeek: 0-7 (0 or 7 = Sunday, 1 = Monday, etc., or null for any day)`,
	inputSchema: z.object({
		name: z.string().describe("The name/title of the alarm or reminder"),
		description: z.string().describe("The description or message to send when the alarm triggers"),
		minute: z.number().int().min(0).max(59).nullable().describe("Minute (0-59) or null for any minute"),
		hour: z.number().int().min(0).max(23).nullable().describe("Hour in 24-hour format (0-23) or null for any hour"),
		day: z.number().int().min(1).max(31).nullable().describe("Day of month (1-31) or null for any day"),
		month: z.number().int().min(1).max(12).nullable().describe("Month (1-12) or null for any month"),
		dayOfWeek: z.number().int().min(0).max(7).nullable().describe("Day of week (0 or 7=Sunday, 1=Monday, etc.) or null for any day"),
	}),
	execute: async (params: {
		name: string;
		description: string;
		minute: number | null;
		hour: number | null;
		day: number | null;
		month: number | null;
		dayOfWeek: number | null;
	}) => {
		const { name, description, minute, hour, day, month, dayOfWeek } = params;

		if (!currentUserId) {
			return "Error: User context not available. Cannot create alarm.";
		}

		const userId = currentUserId;

		try {
			logger.info("Alarm tool called", { userId, name, minute, hour, day, month, dayOfWeek });

			const isOneTimeAlarm = day !== null && month !== null;

			let expiresAt = 0;

			if (isOneTimeAlarm) {
				const now = new Date();
				const currentYear = now.getFullYear();
				const alarmMinute = minute !== null ? minute : 0;
				const alarmHour = hour !== null ? hour : 0;

				const alarmDate = new Date(Date.UTC(currentYear, month - 1, day, alarmHour, alarmMinute, 0, 0));

				if (alarmDate < now) {
					alarmDate.setFullYear(currentYear + 1);
				}

				expiresAt = Math.floor(alarmDate.getTime() / 1000);
			}

			await alarmService.createAlarm(userId, {
				name,
				description,
				schedule: {
					timezone: "UTC",
					expiresAt,
					minutes: minute !== null ? [minute] : [-1],
					hours: hour !== null ? [hour] : [-1],
					mdays: day !== null ? [day] : [-1],
					months: month !== null ? [month] : [-1],
					wdays: dayOfWeek !== null ? [dayOfWeek] : [-1],
				},
			});

			const scheduleDesc = `${hour !== null ? hour : "*"}:${minute !== null ? String(minute).padStart(2, "0") : "*"} ${day !== null ? `on day ${day}` : ""} ${month !== null ? `month ${month}` : ""} ${dayOfWeek !== null ? `(day ${dayOfWeek})` : ""}`.trim();
			return `Alarm "${name}" has been created successfully and will trigger at ${scheduleDesc}.`;
		} catch (error) {
			logger.error(error, { context: "alarmTool", userId });
			return `Failed to create alarm: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
});
