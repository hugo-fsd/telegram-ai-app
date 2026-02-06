import { tool } from "ai";
import { z } from "zod";
import { alarmService } from "../../services/alarm.service";
import { logger } from "../../services/logger.service";

// Context to store userId for tool execution
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
	
	You must provide a valid cron expression. Common examples:
	- Every day at 9 AM: "0 9 * * *"
	- Every Monday at 8 AM: "0 8 * * 1"
	- Every hour: "0 * * * *"
	- Every 30 minutes: "*/30 * * * *"
	- Specific date/time: "0 14 25 12 *" (Dec 25 at 2 PM)
	
	Cron format: "minute hour day month dayOfWeek"
	- minute: 0-59
	- hour: 0-23
	- day: 1-31
	- month: 1-12
	- dayOfWeek: 0-7 (0 or 7 = Sunday)`,
	inputSchema: z.object({
		name: z.string().describe("The name/title of the alarm or reminder"),
		description: z.string().describe("The description or message to send when the alarm triggers"),
		cronExpression: z.string().describe("Cron expression for when to trigger the alarm (format: 'minute hour day month dayOfWeek')"),
	}),
	execute: async (params: { name: string; description: string; cronExpression: string }) => {
		const { name, description, cronExpression } = params;
		
		if (!currentUserId) {
			return "Error: User context not available. Cannot create alarm.";
		}

		const userId = currentUserId;
		
		try {
			logger.info("Alarm tool called", { userId, name, cronExpression });

			// Validate cron expression format (basic check)
			const cronParts = cronExpression.trim().split(/\s+/);
			if (cronParts.length !== 5) {
				throw new Error(`Invalid cron expression. Expected 5 parts, got ${cronParts.length}. Format: "minute hour day month dayOfWeek"`);
			}

			// Create the alarm
			await alarmService.createAlarm(userId, {
				name,
				description,
				cronExpression,
			});

			return `Alarm "${name}" has been created successfully and will trigger according to the schedule (${cronExpression}).`;
		} catch (error) {
			logger.error(error, { context: "alarmTool", userId });
			return `Failed to create alarm: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
});
