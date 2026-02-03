import type { ModelMessage } from "ai";
import { conversationStarterAgent } from "../ai/agents/conversation-starter.agent";
import type { Conversation } from "../models/converstation";
import { conversationsRepository } from "../repositories/conversations.repository";
import { removeEmpty } from "./utils.service";

export const conversationsService = {
	async getUserConversations(userId: string): Promise<Conversation[]> {
		return await conversationsRepository.getUserConversations(userId);
	},

	async createConversation(userId: string, userMessage: string): Promise<Conversation> {
		const conversation = await conversationStarterAgent.createConversation(userId, userMessage);
		await conversationsRepository.createConversation(conversation);

		return conversation;
	},

	async getConversation(conversationId: string): Promise<Conversation | null> {
		return await conversationsRepository.getConversation(conversationId);
	},

	async updateConversation(conversationId: string, conversation: Conversation): Promise<void> {
		await conversationsRepository.updateConversation(conversationId, conversation);
	},

	async addMessage(conversationId: string, message: ModelMessage): Promise<void> {
		const cleanMessage = removeEmpty(message);
		await conversationsRepository.addMessage(conversationId, cleanMessage);
	},

	async addMessages(conversationId: string, messages: ModelMessage[]): Promise<void> {
		const cleanMessages = messages.map((message) => removeEmpty(message));
		await conversationsRepository.addMessages(conversationId, cleanMessages);
	},

	async getConversationMessages(conversationId: string, limit = 999): Promise<ModelMessage[]> {
		return await conversationsRepository.getConversationMessages(conversationId, limit);
	},
};
