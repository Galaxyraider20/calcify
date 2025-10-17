import { promises as fs } from "node:fs";
import path from "node:path";

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import {
	deleteCourseFile,
	insertCourseFile,
	listCourseFilesForUser,
} from "@/db/course-files";

const UPLOAD_ROOT = path.join(process.cwd(), "private_uploads");
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

async function ensureAuth() {
	const { userId } = await auth();
	if (!userId) {
		return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
	}
	return { userId };
}

async function ensureUploadDir(userId: string) {
	const userDir = path.join(UPLOAD_ROOT, userId);
	await fs.mkdir(userDir, { recursive: true });
	return userDir;
}

export async function GET() {
	const session = await ensureAuth();
	if ("error" in session) {
		return session.error;
	}

	const files = await listCourseFilesForUser(session.userId);
	return NextResponse.json({ files });
}

export async function POST(request: Request) {
	const session = await ensureAuth();
	if ("error" in session) {
		return session.error;
	}

	const formData = await request.formData();
	const file = formData.get("file");

	if (!file || !(file instanceof File)) {
		return NextResponse.json(
			{ error: "Missing file in request payload." },
			{ status: 400 },
		);
	}

	if (file.size > MAX_FILE_SIZE) {
		return NextResponse.json(
			{ error: "File is too large. Max size is 10 MB." },
			{ status: 400 },
		);
	}

	const userDir = await ensureUploadDir(session.userId);
	const timestamp = Date.now();
	const safeName = file.name.replace(/[^\w.-]+/g, "_");
	const filename = `${timestamp}-${safeName}`;
	const storagePath = path.join(session.userId, filename);
	const fullPath = path.join(userDir, filename);

	const arrayBuffer = await file.arrayBuffer();
	await fs.writeFile(fullPath, Buffer.from(arrayBuffer));

	const created = await insertCourseFile({
		userId: session.userId,
		originalName: file.name,
		mimeType: file.type || null,
		sizeBytes: file.size,
		storagePath,
	});

	return NextResponse.json({ file: created }, { status: 201 });
}

export async function DELETE(request: Request) {
	const session = await ensureAuth();
	if ("error" in session) {
		return session.error;
	}

	let payload: { id?: string } = {};
	try {
		payload = await request.json();
	} catch {
		return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
	}

	if (!payload.id) {
		return NextResponse.json({ error: "Missing file id." }, { status: 400 });
	}

	// Fetch file to get storage path
	const files = await listCourseFilesForUser(session.userId);
	const target = files.find((file) => file.id === payload.id);

	if (!target) {
		return NextResponse.json({ error: "File not found." }, { status: 404 });
	}

	const fullPath = path.join(UPLOAD_ROOT, target.storagePath);
	await deleteCourseFile(session.userId, payload.id);

	try {
		await fs.unlink(fullPath);
	} catch (error) {
		// Ignore missing file errors; could happen if manually deleted
		console.warn("Failed to remove file from disk", error);
	}

	return NextResponse.json({ success: true });
}
