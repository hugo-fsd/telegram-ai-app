import type { CreateUserRequest, User } from "../models/user";
import { userRepository } from "../repositories/user.repository";

export const usersService = {
	async createUser(input: CreateUserRequest, userId?: string): Promise<void> {
		const user: User = {
			...input,
			userId: userId ?? crypto.randomUUID(),
			conversations: [],
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		await userRepository.createUser(user);
	},

	async getUserById(id: string): Promise<User | null> {
		const user = await userRepository.getUserById(id);
		return user;
	},

	async getAllUsers(): Promise<User[]> {
		const users = await userRepository.getAllUsers();
		return users;
	},
};
