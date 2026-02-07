import axios from "axios";
import { env } from "../config/env";
import { logger } from "./logger.service";

interface CronJobResponse {
	jobId: number;
}

interface CreateCronJobRequest {
	job: {
		title: string;
		url: string;
		enabled: boolean;
		saveResponses: boolean;
		requestMethod: number;
		schedule: {
			timezone: string;
			expiresAt: number;
			hours: number[];
			minutes: number[];
			mdays: number[];
			months: number[];
			wdays: number[];
		};
	};
}

class CronJobService {
	private readonly apiKey: string;
	private readonly baseUrl = "https://api.cron-job.org";

	constructor() {
		this.apiKey = env.CRONJOB_API_KEY;
	}

	private getHeaders() {
		return {
			"Content-Type": "application/json",
			"Authorization": `Bearer ${this.apiKey}`,
		};
	}

	async createJob(url: string, schedule: CreateCronJobRequest["job"]["schedule"], title: string): Promise<number> {
		try {
			const requestBody: CreateCronJobRequest = {
				job: {
					title,
					url,
					enabled: true,
					saveResponses: true,
					requestMethod: 0, // GET
					schedule: {
						...schedule,
						expiresAt: schedule.expiresAt ?? 0,
					},
				},
			};

			console.log("[CRON JOB SERVICE] Creating job", JSON.stringify(requestBody, null, 2));
			const response = await axios.put<CronJobResponse>(
				`${this.baseUrl}/jobs`,
				requestBody,
				{ headers: this.getHeaders() }
			);

			console.log("[CRON JOB SERVICE] Job created", { response: response.data });

			logger.info("Cron job created", {
				jobId: response.data.jobId,
				title,
				url,
			});

			return response.data.jobId;
		} catch (error) {
			if (axios.isAxiosError(error)) {
				const errorText = error.response?.data || error.message;
				logger.error(error, { context: "createCronJob", url, title, errorText });
				throw new Error(`Cron-job.org API error: ${error.response?.status || "Unknown"} ${errorText}`);
			}
			logger.error(error, { context: "createCronJob", url, title });
			throw error;
		}
	}

	async deleteJob(jobId: number): Promise<void> {
		try {
			console.log("[CRON JOB SERVICE] Deleting job", { jobId });
			await axios.delete(`${this.baseUrl}/jobs/${jobId}`, {
				headers: this.getHeaders(),
			});

			logger.info("Cron job deleted", { jobId });
			console.log("[CRON JOB SERVICE] Job deleted", { jobId });
		} catch (error) {
			if (axios.isAxiosError(error)) {
				const errorText = error.response?.data || error.message;
				logger.error(error, { context: "deleteCronJob", jobId, errorText });
				throw new Error(`Cron-job.org API error: ${error.response?.status || "Unknown"} ${errorText}`);
			}
			logger.error(error, { context: "deleteCronJob", jobId });
			throw error;
		}
	}

	async updateJob(jobId: number, url: string, schedule: CreateCronJobRequest["job"]["schedule"], title: string): Promise<void> {
		console.log("[CRON JOB SERVICE] Updating job", { jobId, url, schedule, title });
		try {
			const requestBody: CreateCronJobRequest = {
				job: {
					title,
					url,
					enabled: true,
					saveResponses: true,
					requestMethod: 0, // GET
					schedule: {
						...schedule,
						expiresAt: schedule.expiresAt ?? 0,
					},
				},
			};

			console.log(JSON.stringify(requestBody, null, 2));
			await axios.patch(
				`${this.baseUrl}/jobs/${jobId}`,
				requestBody,
				{ headers: this.getHeaders() }
			);

			logger.info("Cron job updated", { jobId, title });
		} catch (error) {
			if (axios.isAxiosError(error)) {
				const errorText = error.response?.data || error.message;
				logger.error(error, { context: "updateCronJob", jobId, errorText });
				throw new Error(`Cron-job.org API error: ${error.response?.status || "Unknown"} ${errorText}`);
			}
			logger.error(error, { context: "updateCronJob", jobId });
			throw error;
		}
	}

}

export const cronJobService = new CronJobService();
