import type { ModelMessage } from "ai";
import type { Collection, Db } from "mongodb";
import { database } from "../db";
import type { User } from "../models/user";

class UserRepository {
	private readonly collection: Collection<User>;

	constructor(db: Db, collectionName: string) {
		this.collection = db.collection<User>(collectionName);
	}

	async createUser(user: User): Promise<void> {
		await this.collection.insertOne(user);
	}

	async getUserById(id: string): Promise<User | null> {
		return await this.collection.findOne({ userId: id });
	}

	async getAllUsers(): Promise<User[]> {
		return await this.collection.find().toArray();
	}

	async addMessage(userId: string, message: ModelMessage): Promise<void> {
		await this.collection.updateOne({ userId: userId }, { $push: { messages: message } });
	}

	async addMessages(userId: string, messages: ModelMessage[]): Promise<void> {
		await this.collection.updateOne({ userId: userId }, { $push: { messages: { $each: messages } } });
	}
}

export const userRepository = new UserRepository(database.getDb(), "users");
