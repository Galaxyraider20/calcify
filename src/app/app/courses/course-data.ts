import type { CourseRow } from "@/db/schema";

export type CourseSource =
	| {
			type: "upload";
			fileId: string;
			originalName: string;
			mimeType: string;
	  }
	| {
			type: "catalog" | "link";
			href: string;
	  };

export type CourseTopic = {
	order: number;
	label: string;
	weeks: number[];
};

export type CourseAssessment = {
	type: string;
	date: string;
};

export type CourseResource = {
	type: string;
	label: string;
	href: string | null;
};

export type CourseVisual = {
	type: string;
	graphId: string;
};

export type CourseProblemStep =
	| { kind: "hint"; text: string }
	| { kind: "check"; expect: string };

export type CourseProblem = {
	id: string;
	prompt: string;
	tags: string[];
	difficulty: string;
	solutionGuide: {
		steps: CourseProblemStep[];
	};
};

export type CourseProblemSet = {
	id: string;
	title: string;
	problems: CourseProblem[];
};

export type CourseLesson = {
	id: string;
	order: number;
	title: string;
	objectives: string[];
	resources: CourseResource[];
	visuals: CourseVisual[];
	problemSets: CourseProblemSet[];
};

export type CourseChapter = {
	id: string;
	order: number;
	title: string;
	startDate: string;
	dueDate: string;
	lessons: CourseLesson[];
};

export type CourseCalendarItem = {
	date: string;
	type: string;
	refId: string;
};

export type CoursePlan = {
	chapters: CourseChapter[];
	calendar: CourseCalendarItem[];
};

export type CourseProgress = {
	completionPct: number;
	lastTouchedAt: string;
};

export type CourseRecord = {
	id: string;
	userId: string;
	title: string;
	source?: CourseSource;
	syllabusExtract: {
		term: string;
		instructor: string;
		meetingTimes: string[];
		topics: CourseTopic[];
		assessments: CourseAssessment[];
	};
	plan: CoursePlan;
	progress: CourseProgress;
	createdAt: string;
	updatedAt: string;
};

type UnknownRecord = Record<string, unknown>;

function isPlainObject(value: unknown): value is UnknownRecord {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toStringWithFallback(value: unknown, fallback: string) {
	return typeof value === "string" && value.trim().length > 0
		? value
		: fallback;
}

function toOptionalString(value: unknown) {
	return typeof value === "string" && value.trim().length > 0
		? value
		: undefined;
}

function toFiniteNumber(value: unknown, fallback: number) {
	return typeof value === "number" && Number.isFinite(value)
		? value
		: fallback;
}

function toNumberArray(value: unknown) {
	return Array.isArray(value)
		? value
				.map((item) =>
					typeof item === "number" && Number.isFinite(item) ? item : null,
				)
				.filter((item): item is number => item !== null)
		: [];
}

function toStringArray(value: unknown) {
	return Array.isArray(value)
		? value.filter(
				(item): item is string =>
					typeof item === "string" && item.trim().length > 0,
			)
		: [];
}

function normalizeCourseSource(value: unknown): CourseSource | undefined {
	if (!isPlainObject(value) || typeof value.type !== "string") {
		return undefined;
	}

	if (value.type === "upload") {
		const fileId = toOptionalString(value.fileId);
		const originalName = toOptionalString(value.originalName);
		const mimeType = toOptionalString(value.mimeType);

		if (!fileId || !originalName || !mimeType) {
			return undefined;
		}

		return {
			type: "upload",
			fileId,
			originalName,
			mimeType,
		};
	}

	if (
		(value.type === "catalog" || value.type === "link") &&
		typeof value.href === "string" &&
		value.href.trim().length > 0
	) {
		return {
			type: value.type,
			href: value.href,
		};
	}

	return undefined;
}

function normalizeTopics(value: unknown) {
	if (!Array.isArray(value)) {
		return [] as CourseTopic[];
	}

	return value
		.map((item, index) => {
			if (!isPlainObject(item)) {
				return null;
			}

			return {
				order: toFiniteNumber(item.order, index + 1),
				label: toStringWithFallback(
					item.label,
					`Topic ${index + 1}`,
				),
				weeks: toNumberArray(item.weeks),
			};
		})
		.filter((topic): topic is CourseTopic => topic !== null);
}

function normalizeAssessments(value: unknown) {
	if (!Array.isArray(value)) {
		return [] as CourseAssessment[];
	}

	return value
		.map((item, index) => {
			if (!isPlainObject(item)) {
				return null;
			}

			return {
				type: toStringWithFallback(item.type, `assessment_${index + 1}`),
				date: toStringWithFallback(
					item.date,
					new Date().toISOString().slice(0, 10),
				),
			};
		})
		.filter((assessment): assessment is CourseAssessment => assessment !== null);
}

function normalizeProblemSteps(value: unknown) {
	if (!Array.isArray(value)) {
		return [] as CourseProblemStep[];
	}

	return value
		.map((item) => {
			if (!isPlainObject(item) || typeof item.kind !== "string") {
				return null;
			}

			if (item.kind === "hint") {
				const text = toOptionalString(item.text);
				return text ? { kind: "hint", text } : null;
			}

			if (item.kind === "check") {
				const expect = toOptionalString(item.expect);
				return expect ? { kind: "check", expect } : null;
			}

			return null;
		})
		.filter((step): step is CourseProblemStep => step !== null);
}

function normalizeProblems(value: unknown) {
	if (!Array.isArray(value)) {
		return [] as CourseProblem[];
	}

	return value
		.map((item, index) => {
			if (!isPlainObject(item)) {
				return null;
			}

			const id = toStringWithFallback(item.id, `problem_${index + 1}`);
			const prompt = toStringWithFallback(
				item.prompt,
				"Problem prompt pending.",
			);

			return {
				id,
				prompt,
				tags: toStringArray(item.tags),
				difficulty: toStringWithFallback(
					item.difficulty,
					"medium",
				),
				solutionGuide: {
					steps: normalizeProblemSteps(
						isPlainObject(item.solutionGuide)
							? item.solutionGuide.steps
							: undefined,
					),
				},
			};
		})
		.filter((problem): problem is CourseProblem => problem !== null);
}

function normalizeProblemSets(value: unknown) {
	if (!Array.isArray(value)) {
		return [] as CourseProblemSet[];
	}

	return value
		.map((item, index) => {
			if (!isPlainObject(item)) {
				return null;
			}

			return {
				id: toStringWithFallback(item.id, `problem_set_${index + 1}`),
				title: toStringWithFallback(
					item.title,
					`Problem Set ${index + 1}`,
				),
				problems: normalizeProblems(item.problems),
			};
		})
		.filter((problemSet): problemSet is CourseProblemSet => problemSet !== null);
}

function normalizeResources(value: unknown) {
	if (!Array.isArray(value)) {
		return [] as CourseResource[];
	}

	return value
		.map((item, index) => {
			if (!isPlainObject(item)) {
				return null;
			}

			const label = toStringWithFallback(
				item.label,
				`Resource ${index + 1}`,
			);
			const type = toStringWithFallback(item.type, "resource");
			const href =
				typeof item.href === "string" && item.href.trim().length > 0
					? item.href
					: null;

			return { type, label, href };
		})
		.filter((resource): resource is CourseResource => resource !== null);
}

function normalizeVisuals(value: unknown) {
	if (!Array.isArray(value)) {
		return [] as CourseVisual[];
	}

	return value
		.map((item, index) => {
			if (!isPlainObject(item)) {
				return null;
			}

			const type = toStringWithFallback(item.type, "visual");
			const graphId = toStringWithFallback(
				item.graphId,
				`graph_${index + 1}`,
			);

			return { type, graphId };
		})
		.filter((visual): visual is CourseVisual => visual !== null);
}

function normalizeLessons(value: unknown) {
	if (!Array.isArray(value)) {
		return [] as CourseLesson[];
	}

	return value
		.map((item, index) => {
			if (!isPlainObject(item)) {
				return null;
			}

			return {
				id: toStringWithFallback(item.id, `lesson_${index + 1}`),
				order: toFiniteNumber(item.order, index + 1),
				title: toStringWithFallback(item.title, `Lesson ${index + 1}`),
				objectives: toStringArray(item.objectives),
				resources: normalizeResources(item.resources),
				visuals: normalizeVisuals(item.visuals),
				problemSets: normalizeProblemSets(item.problemSets),
			};
		})
		.filter((lesson): lesson is CourseLesson => lesson !== null);
}

function normalizeChapters(value: unknown) {
	if (!Array.isArray(value)) {
		return [] as CourseChapter[];
	}

	return value
		.map((item, index) => {
			if (!isPlainObject(item)) {
				return null;
			}

			return {
				id: toStringWithFallback(item.id, `chapter_${index + 1}`),
				order: toFiniteNumber(item.order, index + 1),
				title: toStringWithFallback(item.title, `Chapter ${index + 1}`),
				startDate: toStringWithFallback(
					item.startDate,
					new Date().toISOString().slice(0, 10),
				),
				dueDate: toStringWithFallback(
					item.dueDate,
					new Date().toISOString().slice(0, 10),
				),
				lessons: normalizeLessons(item.lessons),
			};
		})
		.filter((chapter): chapter is CourseChapter => chapter !== null);
}

function normalizeCalendar(value: unknown) {
	if (!Array.isArray(value)) {
		return [] as CourseCalendarItem[];
	}

	return value
		.map((item, index) => {
			if (!isPlainObject(item)) {
				return null;
			}

			return {
				date: toStringWithFallback(
					item.date,
					new Date().toISOString().slice(0, 10),
				),
				type: toStringWithFallback(item.type, "lesson"),
				refId: toStringWithFallback(item.refId, `ref_${index + 1}`),
			};
		})
		.filter((calendarItem): calendarItem is CourseCalendarItem => calendarItem !== null);
}

export function normalizeCourseRecord(
	userId: string,
	payload: unknown,
	fallback?: {
		id?: string;
		title?: string;
		createdAt?: string;
		updatedAt?: string;
	},
): CourseRecord | null {
	if (!isPlainObject(payload)) {
		return null;
	}

	const nowIso = new Date().toISOString();
	const raw = payload as UnknownRecord;

	const fallbackId = fallback?.id ?? `course_${Date.now()}`;
	const fallbackTitle = fallback?.title ?? "Untitled Course";
	const fallbackCreatedAt = fallback?.createdAt ?? nowIso;
	const fallbackUpdatedAt = fallback?.updatedAt ?? fallbackCreatedAt;

	const syllabusRaw = isPlainObject(raw.syllabusExtract)
		? (raw.syllabusExtract as UnknownRecord)
		: {};
	const planRaw = isPlainObject(raw.plan)
		? (raw.plan as UnknownRecord)
		: {};
	const progressRaw = isPlainObject(raw.progress)
		? (raw.progress as UnknownRecord)
		: {};

	const normalized: CourseRecord = {
		id: toStringWithFallback(raw.id, fallbackId),
		userId: toStringWithFallback(raw.userId, userId),
		title: toStringWithFallback(raw.title, fallbackTitle),
		source: normalizeCourseSource(raw.source),
		syllabusExtract: {
			term: toStringWithFallback(
				syllabusRaw.term,
				"Term TBD",
			),
			instructor: toStringWithFallback(
				syllabusRaw.instructor,
				"Instructor TBD",
			),
			meetingTimes: toStringArray(syllabusRaw.meetingTimes),
			topics: normalizeTopics(syllabusRaw.topics),
			assessments: normalizeAssessments(syllabusRaw.assessments),
		},
		plan: {
			chapters: normalizeChapters(planRaw.chapters),
			calendar: normalizeCalendar(planRaw.calendar),
		},
		progress: {
			completionPct: Math.min(
				Math.max(toFiniteNumber(progressRaw.completionPct, 0), 0),
				1,
			),
			lastTouchedAt: toStringWithFallback(
				progressRaw.lastTouchedAt,
				fallbackUpdatedAt,
			),
		},
		createdAt: toStringWithFallback(raw.createdAt, fallbackCreatedAt),
		updatedAt: toStringWithFallback(raw.updatedAt, fallbackUpdatedAt),
	};

	return normalized;
}

export function courseRowToRecord(row: CourseRow): CourseRecord | null {
	const createdAt =
		row.createdAt instanceof Date
			? row.createdAt.toISOString()
			: new Date().toISOString();
	const updatedAt =
		row.updatedAt instanceof Date
			? row.updatedAt.toISOString()
			: createdAt;

	return normalizeCourseRecord(row.userId, row.metadata ?? {}, {
		id: row.id,
		title: row.title ?? "Untitled Course",
		createdAt,
		updatedAt,
	});
}

export function requireCourseRecord(row: CourseRow): CourseRecord {
	const record = courseRowToRecord(row);
	if (!record) {
		throw new Error("Course metadata missing or malformed.");
	}
	return record;
}
