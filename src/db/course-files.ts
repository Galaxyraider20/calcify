import { and, asc, eq } from "drizzle-orm";

import { db } from "./client";
import { courseFiles } from "./schema";

export async function listCourseFilesForUser(userId: string) {
	return db
		.select()
		.from(courseFiles)
		.where(eq(courseFiles.userId, userId))
		.orderBy(asc(courseFiles.createdAt));
}

export async function insertCourseFile(payload: {
	userId: string;
	originalName: string;
	mimeType: string | null;
	sizeBytes: number;
	storagePath: string;
}) {
	const [created] = await db
		.insert(courseFiles)
		.values({
			userId: payload.userId,
			originalName: payload.originalName,
			mimeType: payload.mimeType,
			sizeBytes: payload.sizeBytes,
			storagePath: payload.storagePath,
		})
		.returning();

	return created;
}

export async function deleteCourseFile(userId: string, fileId: string) {
	return db
		.delete(courseFiles)
		.where(
			and(eq(courseFiles.userId, userId), eq(courseFiles.id, fileId)),
		);
}
