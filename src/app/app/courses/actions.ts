"use server";

import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { courses } from "@/db/schema";

export type CoursePayload = {
	title: string;
	description?: string;
	metadata?: Record<string, unknown>;
};

export async function listCourses() {
	const { userId } = await auth();
	if (!userId) {
		throw new Error("Unauthorized");
	}

	return db
		.select()
		.from(courses)
		.where(eq(courses.userId, userId));
}

export async function createCourse(payload: CoursePayload) {
	const { userId } = await auth();
	if (!userId) {
		throw new Error("Unauthorized");
	}

	const [created] = await db
		.insert(courses)
		.values({
			userId,
			title: payload.title,
			description: payload.description ?? null,
			metadata: payload.metadata ?? {},
		})
		.returning();

	return created;
}

export async function removeCourse(courseId: string) {
	const { userId } = await auth();
	if (!userId) {
		throw new Error("Unauthorized");
	}

	await db
		.delete(courses)
		.where(and(eq(courses.userId, userId), eq(courses.id, courseId)));
}

export async function getCourseById(courseId: string) {
	const { userId } = await auth();
	if (!userId) {
		throw new Error("Unauthorized");
	}

	const [course] = await db
		.select()
		.from(courses)
		.where(and(eq(courses.userId, userId), eq(courses.id, courseId)));

	return course ?? null;
}
