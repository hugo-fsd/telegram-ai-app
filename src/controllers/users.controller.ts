import { Elysia } from "elysia";
import { createUserSchema } from "../models/user";
import { usersService } from "../services/users.service";

export const usersController = new Elysia()
	.get("/users", async () => {
		return await usersService.getAllUsers();
	})

	.get("/users/:id", async ({ params }) => {
		return await usersService.getUserById(params.id);
	})

	.post("/users", async ({ body, set }) => {
		await usersService.createUser(body);
		set.status = 201;
	}, {
		body: createUserSchema,
	});
