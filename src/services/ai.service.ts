import type { ModelMessage } from "ai";
import { generalAgent } from "../ai/agents/general.agent";

export const aiService = {
	async processMessage(messages: ModelMessage[]) {
		const now = new Date();
		const dateString = now.toLocaleDateString("en-US", {
			weekday: "long",
			year: "numeric",
			month: "long",
			day: "numeric",
		});
		const timeString = now.toLocaleTimeString("en-US", {
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
			timeZoneName: "short",
		});

		const timeContextMessage: ModelMessage = {
			role: "system",
			content: `Current date and time: ${dateString} at ${timeString} (${now.toISOString()})`,
		};

		const result = await generalAgent.generate({
			messages: [timeContextMessage, ...messages],
		});

		console.log(JSON.stringify(result, null, 2));
		return result;
	},
};
