"use server";

import { auth } from "@clerk/nextjs/server";
import { desc, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { graphHistory } from "@/db/schema";

export type GraphEntryPayload = {
	expression: string;
	variables?: Record<string, number>;
	settings?: Record<string, unknown>;
};

export async function logGraphEntry(payload: GraphEntryPayload) {
	const { userId } = await auth();
	if (!userId) {
		throw new Error("Unauthorized");
	}

	const [created] = await db
		.insert(graphHistory)
		.values({
			userId,
			expression: payload.expression,
			variables: payload.variables ?? {},
			settings: payload.settings ?? {},
		})
		.returning();

	return created;
}

export async function listGraphHistory(limit = 20) {
	const { userId } = await auth();
	if (!userId) {
		throw new Error("Unauthorized");
	}

	return db
		.select()
		.from(graphHistory)
		.where(eq(graphHistory.userId, userId))
		.orderBy(desc(graphHistory.renderedAt))
		.limit(limit);
}

export async function clearGraphHistory() {
	const { userId } = await auth();
	if (!userId) {
		throw new Error("Unauthorized");
	}

	await db.delete(graphHistory).where(eq(graphHistory.userId, userId));
}

