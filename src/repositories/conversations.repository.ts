import type { ModelMessage } from "ai";
import type { Collection, Db } from "mongodb";
import { ObjectId } from "mongodb";
import { database } from "../db";
import type { Conversation } from "../models/converstation";

class ConversationsRepository {
	private readonly collection: Collection<Conversation>;

	constructor(db: Db, collectionName: string) {
		this.collection = db.collection<Conversation>(collectionName);
	}

	async createConversation(conversation: Conversation): Promise<Conversation> {
		const result = await this.collection.insertOne(conversation as Conversation & { _id?: ObjectId });
		return { ...conversation, _id: result.insertedId };
	}

	async getConversation(id: string): Promise<Conversation | null> {
		return await this.collection.findOne({ _id: new ObjectId(id) });
	}


	async getConversationByUserId(userId: string): Promise<Conversation | null> {
		return await this.collection.findOne({ userId });
	}

	async addMessage(conversationId: string, message: ModelMessage): Promise<void> {
		await this.collection.updateOne(
			{ _id: new ObjectId(conversationId) },
			{ $push: { messages: message }, $set: { updatedAt: new Date() } },
		);
	}

	async addMessages(conversationId: string, messages: ModelMessage[]): Promise<void> {
		await this.collection.updateOne(
			{ _id: new ObjectId(conversationId) },
			{ $push: { messages: { $each: messages } }, $set: { updatedAt: new Date() } },
		);
	}
}

export const conversationsRepository = new ConversationsRepository(database.getDb(), "conversations");
