import { env } from "../config/env";
import type { Alarm, CreateAlarmRequest } from "../models/alarm";
import { alarmRepository } from "../repositories/alarm.repository";
import { cronJobService } from "./cron-job.service";
import { logger } from "./logger.service";
import { telegramService } from "./telegram.service";

export const alarmService = {
	async createAlarm(userId: string, input: CreateAlarmRequest): Promise<Alarm> {
		console.log("[ALARM SERVICE] Creating alarm", { userId, input });
		const alarm: Alarm = {
			userId,
			...input,
			active: true,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		const createdAlarm = await alarmRepository.createAlarm(alarm);
		const alarmId = createdAlarm._id?.toString();

		if (!alarmId) {
			throw new Error("Failed to create alarm - no ID returned");
		}

		const webhookUrl = `${env.CRONJOB_WEBHOOK_URL}/${alarmId}`;

		const cronJobId = await cronJobService.createJob(
			webhookUrl,
			input.schedule,
			`Alarm: ${input.name}`
		);

		await alarmRepository.updateAlarm(alarmId, { cronJobId });

		logger.info("Alarm created", {
			userId,
			alarmId,
			cronJobId,
			name: alarm.name,
		});

		await telegramService.sendMessage(userId, `Alarm created: ${alarm.name}`);
		return { ...createdAlarm, cronJobId };
	},

	async getAlarmsByUserId(userId: string): Promise<Alarm[]> {
		return await alarmRepository.getAlarmsByUserId(userId);
	},

	async getActiveAlarms(): Promise<Alarm[]> {
		return await alarmRepository.getActiveAlarms();
	},

	async deleteAlarm(alarmId: string, userId: string): Promise<void> {
		const alarm = await alarmRepository.getAlarmById(alarmId);
		if (!alarm) {
			throw new Error("Alarm not found");
		}
		if (alarm.userId !== userId) {
			throw new Error("Unauthorized");
		}

		if (alarm.cronJobId) {
			try {
				await cronJobService.deleteJob(alarm.cronJobId);
			} catch (error) {
				logger.error(error, { context: "deleteAlarm", alarmId, cronJobId: alarm.cronJobId });
			}
		}

		await alarmRepository.deleteAlarm(alarmId);
		logger.info("Alarm deleted", { userId, alarmId });
	},

	async updateAlarm(alarmId: string, userId: string, input: Partial<CreateAlarmRequest>): Promise<Alarm> {
		const alarm = await alarmRepository.getAlarmById(alarmId);
		if (!alarm) {
			throw new Error("Alarm not found");
		}
		if (alarm.userId !== userId) {
			throw new Error("Unauthorized");
		}

		// Update the alarm in database
		const updates: Partial<Alarm> = {
			...input,
			updatedAt: new Date(),
		};
		await alarmRepository.updateAlarm(alarmId, updates);

		// If schedule was updated, update the cron job
		if (input.schedule && alarm.cronJobId) {
			const webhookUrl = `${env.CRONJOB_WEBHOOK_URL}/${alarmId}`;
			try {
				await cronJobService.updateJob(
					alarm.cronJobId,
					webhookUrl,
					input.schedule,
					`Alarm: ${input.name || alarm.name}`
				);
			} catch (error) {
				logger.error(error, { context: "updateAlarm", alarmId, cronJobId: alarm.cronJobId });
			}
		}

		const updatedAlarm = await alarmRepository.getAlarmById(alarmId);
		if (!updatedAlarm) {
			throw new Error("Failed to retrieve updated alarm");
		}

		logger.info("Alarm updated", { userId, alarmId });
		return updatedAlarm;
	},

	async deactivateAlarm(alarmId: string, userId: string): Promise<void> {
		const alarm = await alarmRepository.getAlarmById(alarmId);
		if (!alarm) {
			throw new Error("Alarm not found");
		}
		if (alarm.userId !== userId) {
			throw new Error("Unauthorized");
		}

		if (alarm.cronJobId) {
			try {
				await cronJobService.deleteJob(alarm.cronJobId);
			} catch (error) {
				logger.error(error, { context: "deactivateAlarm", alarmId, cronJobId: alarm.cronJobId });
			}
		}

		await alarmRepository.deactivateAlarm(alarmId);
		logger.info("Alarm deactivated", { userId, alarmId });
	},

	async triggerAlarm(alarmId: string): Promise<void> {
		console.log("[ALARM SERVICE] Triggering alarm", { alarmId });
		try {
			const alarm = await alarmRepository.getAlarmById(alarmId);
			if (!alarm || !alarm.active) {
				logger.warning("Alarm not found or inactive", { alarmId });
				return;
			}

			const message = `⏰ **${alarm.name}**\n\n${alarm.description || "Reminder"}`;
			await telegramService.sendMessage(alarm.userId, message);
			logger.info("Alarm notification sent", {
				userId: alarm.userId,
				alarmId: alarm._id?.toString(),
				name: alarm.name,
			});
		} catch (error) {
			logger.error(error, {
				context: "triggerAlarm",
				alarmId,
			});
		}
	},
};
