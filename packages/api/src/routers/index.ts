import type { RouterClient } from "@orpc/server";
import { db } from "@test-app/db";
import { protectedProcedure, publicProcedure } from "../index";

export const appRouter = {
	healthCheck: publicProcedure.handler(() => {
		return "OK";
	}),
	privateData: protectedProcedure.handler(({ context }) => {
		return {
			message: "This is private",
			user: context.session?.user,
		};
	}),
	test: publicProcedure.handler(async () => {
		const data = await db.query.user.findMany();
		return data;
	}),
};
export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
