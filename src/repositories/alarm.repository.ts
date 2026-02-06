import type { Collection, Db, ObjectId } from "mongodb";
import { database } from "../db";
import type { Alarm } from "../models/alarm";

class AlarmRepository {
	private readonly collection: Collection<Alarm>;

	constructor(db: Db, collectionName: string) {
		this.collection = db.collection<Alarm>(collectionName);
	}

	async createAlarm(alarm: Alarm): Promise<Alarm> {
		const result = await this.collection.insertOne(alarm as Alarm & { _id?: ObjectId });
		return { ...alarm, _id: result.insertedId };
	}

	async getAlarmById(id: string): Promise<Alarm | null> {
		const { ObjectId } = await import("mongodb");
		return await this.collection.findOne({ _id: new ObjectId(id) });
	}

	async getAlarmByCronJobId(cronJobId: number): Promise<Alarm | null> {
		return await this.collection.findOne({ cronJobId });
	}

	async getAlarmsByUserId(userId: string): Promise<Alarm[]> {
		return await this.collection.find({ userId }).toArray();
	}

	async getActiveAlarms(): Promise<Alarm[]> {
		return await this.collection.find({ active: true }).toArray();
	}

	async updateAlarm(id: string, updates: Partial<Alarm>): Promise<void> {
		const { ObjectId } = await import("mongodb");
		await this.collection.updateOne(
			{ _id: new ObjectId(id) },
			{ $set: { ...updates, updatedAt: new Date() } }
		);
	}

	async deleteAlarm(id: string): Promise<void> {
		const { ObjectId } = await import("mongodb");
		await this.collection.deleteOne({ _id: new ObjectId(id) });
	}

	async deactivateAlarm(id: string): Promise<void> {
		const { ObjectId } = await import("mongodb");
		await this.collection.updateOne(
			{ _id: new ObjectId(id) },
			{ $set: { active: false, updatedAt: new Date() } }
		);
	}
}

export const alarmRepository = new AlarmRepository(database.getDb(), "alarms");
