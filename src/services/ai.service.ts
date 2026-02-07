import type { ModelMessage } from "ai";
import { generalAgent } from "../ai/agents/general.agent";
import { setAlarmToolContext } from "../ai/tools/alarm.tool";

export const aiService = {
	async processMessage(messages: ModelMessage[], userId: string) {
		console.log("[AI SERVICE] Processing messages", { messages, userId });
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

		// Set user context for alarm tool (loads user's alarms)
		await setAlarmToolContext(userId);

		const result = await generalAgent.generate({
			messages: [timeContextMessage, ...messages],
		});

		return result;
	},
};
