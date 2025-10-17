"use server";

import { currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";

import { db } from "./client";
import { preferences, users, workspaces } from "./schema";

export async function ensureUserRecord(userId: string) {
	const [existing] = await db
		.select()
		.from(users)
		.where(eq(users.id, userId))
		.limit(1);

	if (existing) {
		await ensureAncillaryRecords(userId);
		return existing;
	}

	const clerkUser = await currentUser();
	const email = clerkUser?.emailAddresses[0]?.emailAddress ?? null;

	const [created] = await db
		.insert(users)
		.values({
			id: userId,
			email,
			firstName: clerkUser?.firstName ?? null,
			lastName: clerkUser?.lastName ?? null,
		})
		.returning();

	await ensureAncillaryRecords(userId);

	return created;
}

async function ensureAncillaryRecords(userId: string) {
	const [pref] = await db
		.select({ userId: preferences.userId })
		.from(preferences)
		.where(eq(preferences.userId, userId))
		.limit(1);

	if (!pref) {
		await db.insert(preferences).values({
			userId,
			theme: "system",
			notificationsEnabled: true,
			calcMode: "symbolic",
			extras: {},
		});
	}

	const [workspace] = await db
		.select({ id: workspaces.id })
		.from(workspaces)
		.where(eq(workspaces.userId, userId))
		.limit(1);

	if (!workspace) {
		await db.insert(workspaces).values({
			userId,
			title: "Main Workspace",
			data: { notes: "" },
		});
	}
}

