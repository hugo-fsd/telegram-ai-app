import Elysia from "elysia";
import { conversationInputSchema } from "../models/converstation";
import { chatService } from "../services/chat.service";

export const chatController = new Elysia()
	.post("/chat", async ({ body, set }) => {
		set.status = 201;
		return await chatService.processMessage(body.userId, body.message);
	},{
		body: conversationInputSchema,
	},
);
