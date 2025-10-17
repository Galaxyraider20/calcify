"use server";

import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import { preferences } from "@/db/schema";

export type PreferencePayload = {
	theme?: string;
	notificationsEnabled?: boolean;
	calcMode?: string;
	extras?: Record<string, unknown>;
};

export async function getPreferences() {
	const { userId } = await auth();
	if (!userId) {
		throw new Error("Unauthorized");
	}

	const [record] = await db
		.select()
		.from(preferences)
		.where(eq(preferences.userId, userId))
		.limit(1);

	return record ?? null;
}

export async function upsertPreferences(payload: PreferencePayload) {
	const { userId } = await auth();
	if (!userId) {
		throw new Error("Unauthorized");
	}

	const [existing] = await db
		.select({ userId: preferences.userId })
		.from(preferences)
		.where(eq(preferences.userId, userId))
		.limit(1);

	if (existing) {
		const [updated] = await db
			.update(preferences)
			.set({
				...payload,
				updatedAt: new Date(),
			})
			.where(eq(preferences.userId, userId))
			.returning();

		return updated;
	}

	const [created] = await db
		.insert(preferences)
		.values({
			userId,
			theme: payload.theme ?? "system",
			notificationsEnabled:
				payload.notificationsEnabled ?? true,
			calcMode: payload.calcMode ?? "symbolic",
			extras: payload.extras ?? {},
		})
		.returning();

	return created;
}

