import { tool } from "ai";
import z from "zod";

export const emailTool = tool({
	description: "Send an email",
	inputSchema: z.object({
		email: z.string().describe("The email to send"),
		subject: z.string().describe("The subject of the email"),
		body: z.string().describe("The body of the email"),
	}),
	execute: async ({ email, subject, body }) => "ive just used the mail tool",
});
