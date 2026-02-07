import { tool } from "ai";
import { z } from "zod";
import type { Alarm } from "../../models/alarm";
import { alarmService } from "../../services/alarm.service";
import { logger } from "../../services/logger.service";

let currentUserId: string | null = null;
let currentUserAlarms: Alarm[] = [];

export const setAlarmToolContext = async (userId: string) => {
	currentUserId = userId;
	currentUserAlarms = await alarmService.getAlarmsByUserId(userId);
};

const formatAlarmsForContext = (alarms: Alarm[]): string => {
	if (alarms.length === 0) {
		return "No existing alarms.";
	}

	return alarms.map((alarm, index) => {
		const schedule = alarm.schedule;
		const hour = schedule.hours[0] === -1 ? "*" : schedule.hours[0];
		const minute = schedule.minutes[0] === -1 ? "*" : schedule.minutes[0];
		const day = schedule.mdays[0] === -1 ? "*" : schedule.mdays[0];
		const month = schedule.months[0] === -1 ? "*" : schedule.months[0];
		const dayOfWeek = schedule.wdays[0] === -1 ? "*" : schedule.wdays[0];

		return `${index + 1}. ID: ${alarm._id?.toString() || "unknown"}, Name: "${alarm.name}", Schedule: ${hour}:${minute} (day ${day}, month ${month}, weekday ${dayOfWeek}), Active: ${alarm.active}`;
	}).join("\n");
};

const getAlarmToolDescription = (): string => {
	const alarmsContext = formatAlarmsForContext(currentUserAlarms);
	return `Manage alarms, reminders, and scheduled notifications for the user.

CURRENT USER'S ALARMS:
${alarmsContext}

OPERATIONS:
- LIST: List all existing alarms for the user.
- CREATE: Create a new alarm. Check existing alarms first to avoid duplicates. ALWAYS provide a message field with the text that should be sent when the alarm triggers.
- UPDATE: Update an existing alarm by its ID. Provide alarmId and the fields to update.
- DELETE: Delete an existing alarm by its ID or name.

IMPORTANT: 
- Use the current date and time from the system context to determine correct values.
- Before creating, check if an alarm with the same name or schedule already exists.
- For updates/deletes, use the alarm ID from the list above.
- Use null for schedule fields that should match any value (wildcards).
- ALWAYS provide a message field when creating or updating alarms. The message is what will be sent to the user when the alarm triggers.

EXAMPLES:
- List all alarms: operation="list"
- Create one-time alarm on Feb 7 at 2:30 PM: operation="create", name="Meeting", message="Don't forget the meeting at 2:30 PM", minute=30, hour=14, day=7, month=2
- Create recurring alarm every day at 9 AM: operation="create", name="Morning reminder", message="Time to wake up!", minute=0, hour=9, day=null, month=null
- Update alarm: operation="update", alarmId="...", name="New name", message="Updated message", hour=10
- Delete alarm: operation="delete", alarmId="..." or name="Alarm name"

FIELD MEANINGS:
- minute: 0-59 (specific minute, or null for any minute)
- hour: 0-23 (specific hour in 24-hour format, or null for any hour)
- day: 1-31 (day of month, or null for any day)
- month: 1-12 (month number, or null for any month)
- dayOfWeek: 0-7 (0 or 7 = Sunday, 1 = Monday, etc., or null for any day)`;
};

export const getAlarmTool = () => tool({
	description: getAlarmToolDescription(),
	inputSchema: z.object({
		operation: z.enum(["list", "create", "update", "delete"]).describe("The operation to perform: list, create, update, or delete"),
		alarmId: z.string().optional().describe("Alarm ID (required for update/delete, optional for create)"),
		name: z.string().optional().describe("The name/title of the alarm (required for create, optional for update)"),
		message: z.string().describe("REQUIRED: The message that will be displayed to the user when the alarm is sent. This is the text content of the alarm notification."),
		minute: z.number().int().min(0).max(59).nullable().optional().describe("Minute (0-59) or null for any minute"),
		hour: z.number().int().min(0).max(23).nullable().optional().describe("Hour in 24-hour format (0-23) or null for any hour"),
		day: z.number().int().min(1).max(31).nullable().optional().describe("Day of month (1-31) or null for any day"),
		month: z.number().int().min(1).max(12).nullable().optional().describe("Month (1-12) or null for any month"),
		dayOfWeek: z.number().int().min(0).max(7).nullable().optional().describe("Day of week (0 or 7=Sunday, 1=Monday, etc.) or null for any day"),
	}),
	execute: async (params: {
		operation: "list" | "create" | "update" | "delete";
		alarmId?: string;
		name?: string;
		message?: string;
		minute?: number | null;
		hour?: number | null;
		day?: number | null;
		month?: number | null;
		dayOfWeek?: number | null;
	}) => {
		console.log("[ALARM TOOL] Executing alarm tool", { params });
		if (!currentUserId) {
			return "Error: User context not available. Cannot manage alarms.";
		}

		const userId = currentUserId;

		const formatAlarmForDisplay = (alarm: Alarm): string => {
			const schedule = alarm.schedule;
			const hour = schedule.hours[0] === -1 ? "*" : String(schedule.hours[0]).padStart(2, "0");
			const minute = schedule.minutes[0] === -1 ? "*" : String(schedule.minutes[0]).padStart(2, "0");
			const day = schedule.mdays[0] === -1 ? "*" : schedule.mdays[0];
			const month = schedule.months[0] === -1 ? "*" : schedule.months[0];
			const dayOfWeek = schedule.wdays[0] === -1 ? "*" : schedule.wdays[0];
			
			const scheduleType = schedule.expiresAt > 0 && schedule.mdays[0] !== -1 && schedule.months[0] !== -1 
				? "One-time" 
				: "Recurring";
			
			let scheduleDesc = `${hour}:${minute}`;
			if (day !== "*") scheduleDesc += ` on day ${day}`;
			if (month !== "*") scheduleDesc += ` of month ${month}`;
			if (dayOfWeek !== "*") scheduleDesc += ` (weekday ${dayOfWeek})`;
			
			return `• **${alarm.name}** (ID: ${alarm._id?.toString() || "unknown"})\n  Type: ${scheduleType}\n  Schedule: ${scheduleDesc}\n  Status: ${alarm.active ? "Active" : "Inactive"}\n  ${alarm.message ? `Message: ${alarm.message}` : ""}`;
		};

		const listAlarms = async () => {
			// Refresh alarms list to get the latest data
			currentUserAlarms = await alarmService.getAlarmsByUserId(userId);
			
			if (currentUserAlarms.length === 0) {
				return "You don't have any alarms set up yet. Use the 'create' operation to create a new alarm.";
			}

			const formattedAlarms = currentUserAlarms.map(formatAlarmForDisplay).join("\n\n");
			return `You have ${currentUserAlarms.length} alarm${currentUserAlarms.length === 1 ? "" : "s"}:\n\n${formattedAlarms}`;
		};

		const createAlarm = async () => {
			const { name, message, minute, hour, day, month, dayOfWeek } = params;
			console.log("[ALARM TOOL] Creating alarm", { name, message, minute, hour, day, month, dayOfWeek });

			if (!name) {
				return "Error: Name is required to create an alarm.";
			}
			// Check for duplicate alarm by name
			const existingAlarm = currentUserAlarms.find(a => a.name.toLowerCase() === name.toLowerCase());
			if (existingAlarm) {
				return `Warning: An alarm named "${name}" already exists (ID: ${existingAlarm._id?.toString()}). Use update operation to modify it, or delete it first.`;
			}
			logger.info("Creating alarm", { userId, name, minute, hour, day, month, dayOfWeek });
			const isOneTimeAlarm = day !== null && day !== undefined && month !== null && month !== undefined;
			let expiresAt = 0;
			if (isOneTimeAlarm && month !== undefined && day !== undefined) {
				const now = new Date();
				const currentYear = now.getFullYear();
				const alarmMinute = minute !== null && minute !== undefined ? minute : 0;
				const alarmHour = hour !== null && hour !== undefined ? hour : 0;

				// Create alarm date
				const alarmDate = new Date(Date.UTC(currentYear, month - 1, day, alarmHour, alarmMinute, 0, 0));

				// If alarm date is in the past, schedule for next year
				if (alarmDate < now) {
					alarmDate.setFullYear(currentYear + 1);
				}

				// Calculate expiry time: 1 minute after alarm time
				const expiryDate = new Date(alarmDate.getTime() + 60000); // Add 1 minute (60000 ms)

				// Format as YYYYMMDDhhmmss
				const year = expiryDate.getUTCFullYear();
				const mon = String(expiryDate.getUTCMonth() + 1).padStart(2, '0');
				const d = String(expiryDate.getUTCDate()).padStart(2, '0');
				const h = String(expiryDate.getUTCHours()).padStart(2, '0');
				const m = String(expiryDate.getUTCMinutes()).padStart(2, '0');
				const s = String(expiryDate.getUTCSeconds()).padStart(2, '0');

				expiresAt = parseInt(`${year}${mon}${d}${h}${m}${s}`, 10);
			}
			await alarmService.createAlarm(userId, {
				name,
				message: message ?? "",
				schedule: {
					timezone: "UTC",
					expiresAt,
					minutes: minute !== null && minute !== undefined ? [minute] : [-1],
					hours: hour !== null && hour !== undefined ? [hour] : [-1],
					mdays: day !== null && day !== undefined ? [day] : [-1],
					months: month !== null && month !== undefined ? [month] : [-1],
					wdays: dayOfWeek !== null && dayOfWeek !== undefined ? [dayOfWeek] : [-1],
				},
			});
			// Refresh alarms list
			currentUserAlarms = await alarmService.getAlarmsByUserId(userId);
			const scheduleDesc = `${hour !== null ? hour : "*"}:${minute !== null ? String(minute).padStart(2, "0") : "*"} ${day !== null ? `on day ${day}` : ""} ${month !== null ? `month ${month}` : ""} ${dayOfWeek !== null ? `(day ${dayOfWeek})` : ""}`.trim();
			return `Alarm "${name}" has been created successfully and will trigger at ${scheduleDesc}.`;
		};

		const updateAlarm = async () => {
			const { alarmId, name, message, minute, hour, day, month, dayOfWeek } = params;

			if (!alarmId) {
				return "Error: alarmId is required to update an alarm.";
			}

			const alarm = currentUserAlarms.find(a => a._id?.toString() === alarmId);
			if (!alarm) {
				return `Error: Alarm with ID "${alarmId}" not found. Check the list of existing alarms above.`;
			}

			logger.info("Updating alarm", { userId, alarmId, updates: params });

			const updateData: Partial<typeof alarm> = {};
			if (name !== undefined) updateData.name = name;
			if (message !== undefined) updateData.message = message;

			// If schedule fields are provided, update the schedule
			if (minute !== undefined || hour !== undefined || day !== undefined || month !== undefined || dayOfWeek !== undefined) {
				const currentSchedule = alarm.schedule;
				// Determine final values for schedule fields (use updated value or keep current)
				const finalMinute = minute !== undefined ? minute : (currentSchedule.minutes[0] === -1 ? null : currentSchedule.minutes[0]);
				const finalHour = hour !== undefined ? hour : (currentSchedule.hours[0] === -1 ? null : currentSchedule.hours[0]);
				const finalDay = day !== undefined ? day : (currentSchedule.mdays[0] === -1 ? null : currentSchedule.mdays[0]);
				const finalMonth = month !== undefined ? month : (currentSchedule.months[0] === -1 ? null : currentSchedule.months[0]);
				
				const isOneTimeAlarm = finalDay !== null && finalDay !== undefined && finalMonth !== null && finalMonth !== undefined;
				let expiresAt = 0;

				// Recalculate expiresAt for one-time alarms
				if (isOneTimeAlarm && finalMonth !== null && finalMonth !== undefined && finalDay !== null && finalDay !== undefined) {
					const now = new Date();
					const currentYear = now.getFullYear();
					const alarmMinute = finalMinute !== null && finalMinute !== undefined ? finalMinute : 0;
					const alarmHour = finalHour !== null && finalHour !== undefined ? finalHour : 0;

					// Create alarm date
					const alarmDate = new Date(Date.UTC(currentYear, finalMonth - 1, finalDay, alarmHour, alarmMinute, 0, 0));

					// If alarm date is in the past, schedule for next year
					if (alarmDate < now) {
						alarmDate.setFullYear(currentYear + 1);
					}

					// Calculate expiry time: 1 minute after alarm time (matching createAlarm logic)
					const expiryDate = new Date(alarmDate.getTime() + 60000); // Add 1 minute (60000 ms)

					// Format as YYYYMMDDhhmmss (matching createAlarm format)
					const year = expiryDate.getUTCFullYear();
					const mon = String(expiryDate.getUTCMonth() + 1).padStart(2, '0');
					const d = String(expiryDate.getUTCDate()).padStart(2, '0');
					const h = String(expiryDate.getUTCHours()).padStart(2, '0');
					const m = String(expiryDate.getUTCMinutes()).padStart(2, '0');
					const s = String(expiryDate.getUTCSeconds()).padStart(2, '0');

					expiresAt = parseInt(`${year}${mon}${d}${h}${m}${s}`, 10);
				}

				updateData.schedule = {
					timezone: "UTC",
					expiresAt,
					minutes: minute !== undefined ? (minute !== null ? [minute] : [-1]) : currentSchedule.minutes,
					hours: hour !== undefined ? (hour !== null ? [hour] : [-1]) : currentSchedule.hours,
					mdays: day !== undefined ? (day !== null ? [day] : [-1]) : currentSchedule.mdays,
					months: month !== undefined ? (month !== null ? [month] : [-1]) : currentSchedule.months,
					wdays: dayOfWeek !== undefined ? (dayOfWeek !== null ? [dayOfWeek] : [-1]) : currentSchedule.wdays,
				};
			}

			await alarmService.updateAlarm(alarmId, userId, updateData);

			// Refresh alarms list
			currentUserAlarms = await alarmService.getAlarmsByUserId(userId);

			return `Alarm "${name || alarm.name}" has been updated successfully.`;
		};

		const deleteAlarm = async () => {
			const { alarmId, name } = params;

			let alarm: Alarm | undefined;

			if (alarmId) {
				alarm = currentUserAlarms.find(a => a._id?.toString() === alarmId);
			} else if (name) {
				alarm = currentUserAlarms.find(a => a.name.toLowerCase() === name.toLowerCase());
			}

			if (!alarm) {
				return `Error: Alarm not found. ${alarmId ? `ID: ${alarmId}` : name ? `Name: ${name}` : "Provide either alarmId or name"}. Check the list of existing alarms above.`;
			}

			const alarmIdToDelete = alarm._id?.toString();
			if (!alarmIdToDelete) {
				return "Error: Alarm ID not found. Cannot delete alarm.";
			}

			logger.info("Deleting alarm", { userId, alarmId: alarmIdToDelete, name: alarm.name });

			await alarmService.deleteAlarm(alarmIdToDelete, userId);

			// Refresh alarms list
			currentUserAlarms = await alarmService.getAlarmsByUserId(userId);

			return `Alarm "${alarm.name}" has been deleted successfully.`;
		};

		try {
			switch (params.operation) {
				case "list":
					return await listAlarms();
				case "create":
					return await createAlarm();
				case "update":
					return await updateAlarm();
				case "delete":
					return await deleteAlarm();
				default:
					return `Error: Unknown operation "${params.operation}". Use "list", "create", "update", or "delete".`;
			}
		} catch (error) {
			logger.error(error, { context: "alarmTool", userId, operation: params.operation });
			return `Failed to ${params.operation} alarm: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
});
