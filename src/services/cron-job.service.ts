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

	private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
		const url = `${this.baseUrl}${endpoint}`;
		const response = await fetch(url, {
			...options,
			headers: {
				"Content-Type": "application/json",
				"Authorization": `Bearer ${this.apiKey}`,
				...options.headers,
			},
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Cron-job.org API error: ${response.status} ${errorText}`);
		}

		return response.json() as Promise<T>;
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

			const response = await this.request<CronJobResponse>("/jobs", {
				method: "PUT",
				body: JSON.stringify(requestBody),
			});

			logger.info("Cron job created", {
				jobId: response.jobId,
				title,
				url,
			});

			return response.jobId;
		} catch (error) {
			logger.error(error, { context: "createCronJob", url, title });
			throw error;
		}
	}

	async deleteJob(jobId: number): Promise<void> {
		try {
			await this.request(`/jobs/${jobId}`, {
				method: "DELETE",
			});

			logger.info("Cron job deleted", { jobId });
		} catch (error) {
			logger.error(error, { context: "deleteCronJob", jobId });
			throw error;
		}
	}

	async updateJob(jobId: number, url: string, schedule: CreateCronJobRequest["job"]["schedule"], title: string): Promise<void> {
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

			await this.request(`/jobs/${jobId}`, {
				method: "PUT",
				body: JSON.stringify(requestBody),
			});

			logger.info("Cron job updated", { jobId, title });
		} catch (error) {
			logger.error(error, { context: "updateCronJob", jobId });
			throw error;
		}
	}

}

export const cronJobService = new CronJobService();
