import { env } from "../config/env";
import { logger } from "./logger.service";

interface CronJobResponse {
	job: {
		job_id: number;
		enabled: number;
		url: string;
		timezone: string;
		title: string;
	};
}

interface CreateCronJobRequest {
	url: string;
	schedule: {
		timezone: string;
		hours: number[];
		mdays: number[];
		minutes: number[];
		months: number[];
		wdays: number[];
	};
	title: string;
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

		return response.json();
	}

	async createJob(url: string, cronExpression: string, title: string): Promise<number> {
		try {
			// Convert cron expression to cron-job.org schedule format
			const schedule = this.parseCronExpression(cronExpression);

			const requestBody: CreateCronJobRequest = {
				url,
				schedule,
				title,
			};

			const response = await this.request<CronJobResponse>("/jobs", {
				method: "POST",
				body: JSON.stringify(requestBody),
			});

			logger.info("Cron job created", {
				jobId: response.job.job_id,
				title,
				url,
			});

			return response.job.job_id;
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

	async updateJob(jobId: number, url: string, cronExpression: string, title: string): Promise<void> {
		try {
			const schedule = this.parseCronExpression(cronExpression);

			const requestBody: CreateCronJobRequest = {
				url,
				schedule,
				title,
			};

			await this.request(`/jobs/${jobId}`, {
				method: "PATCH",
				body: JSON.stringify(requestBody),
			});

			logger.info("Cron job updated", { jobId, title });
		} catch (error) {
			logger.error(error, { context: "updateCronJob", jobId });
			throw error;
		}
	}

	private parseCronExpression(cronExpression: string): CreateCronJobRequest["schedule"] {
		// Cron format: "minute hour day month dayOfWeek"
		const parts = cronExpression.trim().split(/\s+/);
		if (parts.length !== 5) {
			throw new Error(`Invalid cron expression: ${cronExpression}`);
		}

		const [minute, hour, day, month, dayOfWeek] = parts;

		return {
			timezone: "UTC",
			minutes: this.parseCronField(minute, 0, 59),
			hours: this.parseCronField(hour, 0, 23),
			mdays: this.parseCronField(day, 1, 31),
			months: this.parseCronField(month, 1, 12),
			wdays: this.parseCronField(dayOfWeek, 0, 7),
		};
	}

	private parseCronField(field: string, min: number, max: number): number[] {
		// Handle wildcard
		if (field === "*") {
			return Array.from({ length: max - min + 1 }, (_, i) => i + min);
		}

		// Handle step values (e.g., */30)
		if (field.includes("/")) {
			const [range, step] = field.split("/");
			const stepNum = parseInt(step, 10);
			const rangeMin = range === "*" ? min : parseInt(range, 10);
			const result: number[] = [];
			for (let i = rangeMin; i <= max; i += stepNum) {
				result.push(i);
			}
			return result;
		}

		// Handle ranges (e.g., 1-5)
		if (field.includes("-")) {
			const [start, end] = field.split("-").map((n) => parseInt(n, 10));
			return Array.from({ length: end - start + 1 }, (_, i) => i + start);
		}

		// Handle comma-separated values (e.g., 1,3,5)
		if (field.includes(",")) {
			return field.split(",").map((n) => parseInt(n.trim(), 10));
		}

		// Single value
		return [parseInt(field, 10)];
	}
}

export const cronJobService = new CronJobService();
