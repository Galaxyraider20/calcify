"use server";

import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import { workspaces } from "@/db/schema";

export type WorkspacePayload = {
	title: string;
	data: Record<string, unknown>;
};

export async function getWorkspace() {
	const { userId } = await auth();
	if (!userId) {
		throw new Error("Unauthorized");
	}

	const [record] = await db
		.select()
		.from(workspaces)
		.where(eq(workspaces.userId, userId))
		.limit(1);

	return record ?? null;
}

export async function upsertWorkspace(payload: WorkspacePayload) {
	const { userId } = await auth();
	if (!userId) {
		throw new Error("Unauthorized");
	}

	const [existing] = await db
		.select({ id: workspaces.id })
		.from(workspaces)
		.where(eq(workspaces.userId, userId))
		.limit(1);

	if (existing) {
		const [updated] = await db
			.update(workspaces)
			.set({
				title: payload.title,
				data: payload.data,
				updatedAt: new Date(),
			})
			.where(eq(workspaces.id, existing.id))
			.returning();

		return updated;
	}

	const [created] = await db
		.insert(workspaces)
		.values({
			userId,
			title: payload.title,
			data: payload.data,
		})
		.returning();

	return created;
}

