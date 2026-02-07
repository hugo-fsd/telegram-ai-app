import { env } from "../config/env";
import type { Alarm, CreateAlarmRequest } from "../models/alarm";
import { alarmRepository } from "../repositories/alarm.repository";
import { cronJobService } from "./cron-job.service";
import { logger } from "./logger.service";
import { telegramService } from "./telegram.service";

export const alarmService = {
	async createAlarm(userId: string, input: CreateAlarmRequest): Promise<Alarm> {
		console.log("[ALARM SERVICE] Creating alarm", { userId, input });

		const { ObjectId } = await import("mongodb");
		const alarmId = new ObjectId().toString();
		const webhookUrl = `${env.CRONJOB_WEBHOOK_URL}/${alarmId}`;

		const cronJobId = await cronJobService.createJob(
			webhookUrl,
			input.schedule,
			`Alarm: ${input.name}`
		);

		const alarm: Alarm = {
			_id: new ObjectId(alarmId),
			userId,
			name: input.name,
			message: input.message ?? "",
			schedule: input.schedule,
			cronJobId,
			active: true,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		console.log("[ALARM SERVICE] Alarm object before save", { alarm });
		const createdAlarm = await alarmRepository.createAlarm(alarm);

		logger.info("Alarm created", {
			userId,
			alarmId,
			cronJobId,
			name: alarm.name,
		});

		return createdAlarm;
	},

	async getAlarmsByUserId(userId: string): Promise<Alarm[]> {
		return await alarmRepository.getAlarmsByUserId(userId);
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


	async triggerAlarm(alarmId: string): Promise<void> {
		console.log("[ALARM SERVICE] Triggering alarm", { alarmId });

		try {
			const alarm = await alarmRepository.getAlarmById(alarmId);
			if (!alarm || !alarm.active) {
				logger.warning("Alarm not found or inactive", { alarmId });
				return;
			}

			await telegramService.sendMessage(alarm.userId, `⏰ <b><i>Alarm: ${alarm.name}</i></b>\n${alarm.message}`);

			logger.info("Alarm notification sent", {
				userId: alarm.userId,
				alarmId: alarm._id?.toString(),
				name: alarm.name,
			});

			const isOneTimeAlarm = alarm.schedule.expiresAt > 0 &&
				alarm.schedule.mdays[0] !== -1 &&
				alarm.schedule.months[0] !== -1;

			if (isOneTimeAlarm) {
				logger.info("One-time alarm triggered, deleting", {
					alarmId: alarm._id?.toString(),
					userId: alarm.userId,
					name: alarm.name,
				});

				if (alarm.cronJobId) {
					try {
						await cronJobService.deleteJob(alarm.cronJobId);
					} catch (error) {
						logger.error(error, {
							context: "triggerAlarm - delete cron job",
							alarmId,
							cronJobId: alarm.cronJobId
						});
					}
				}

				await alarmRepository.deleteAlarm(alarmId);
				logger.info("One-time alarm deleted after triggering", {
					alarmId: alarm._id?.toString(),
					userId: alarm.userId,
				});
			}
		} catch (error) {
			logger.error(error, {
				context: "triggerAlarm",
				alarmId,
			});
		}
	},
};
