import { type Db, MongoClient } from "mongodb";
import { env } from "./config/env";

class Database {
	private client: MongoClient | null = null;
	private db: Db | null = null;

	async connect(): Promise<void> {
		if (this.db) return;

		if (!env) {
			throw new Error("Environment variables not properly configured");
		}

		this.client = new MongoClient(env.MONGODB_URI);
		await this.client.connect();
		this.db = this.client.db(env.MONGODB_DB_NAME);

		console.log(`✅ Connected to MongoDB: ${env.MONGODB_DB_NAME}`);
	}

	getDb(): Db {
		if (!this.db) {
			throw new Error("Database not connected. Call connect() first.");
		}
		return this.db;
	}

	async disconnect(): Promise<void> {
		if (this.client) {
			await this.client.close();
			this.client = null;
			this.db = null;
			console.log("Disconnected from MongoDB");
		}
	}
}

export const database = new Database();

process.on("SIGINT", async () => {
	await database.disconnect();
	process.exit(0);
});

process.on("SIGTERM", async () => {
	await database.disconnect();
	process.exit(0);
});
