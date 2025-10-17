"use server";

import { promises as fs } from "node:fs";
import path from "node:path";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

import { db } from "@/db/client";
import { listCourseFilesForUser } from "@/db/course-files";
import { courses, courseTopics } from "@/db/schema";
import { normalizeCourseRecord } from "../course-data";

export type CourseChatAttachment = {
	id: string;
	originalName: string;
	mimeType: string | null;
	sizeBytes: number;
	createdAt: string;
};

export type CourseChatMessage = {
	role: "user" | "assistant";
	content: string;
	savedCourseId?: string;
	attachments?: CourseChatAttachment[];
};

const systemPrompt = `You are Calcify's course architect and mentor. The learner is a student who may not know what to ask for or which details matter. Lead the intake, study the materials you are given, and deliver a complete, student-ready course.

Operate with these directives:
1. Proactively run the discovery. Read every uploaded file. Summarize what you learn, list missing pieces, and ask targeted questions that a student can answer (preferences, deadlines, study habits, pain points).
2. If critical information is missing, suggest reasonable defaults, explain the assumption, and ask for confirmation in the same message.
3. Translate the syllabus and any extra context into a multi-week plan. Break topics into chapters, lessons, and practice sessions that fit the term length. Balance workload week to week.
4. Build rich problem sets. Every lesson should surface at least two problem sets with 3-5 problems each. Mix difficulties, add tags, and include step-by-step solution guides with hints and checks.
5. Recommend supporting resources (textbook sections, videos, simulations, office hours) and visuals (graphs, diagrams) wherever they help mastery.
6. Keep progress metadata current: set completionPct to 0.0 for new plans and lastTouchedAt to the current ISO timestamp.
7. Throughout the dialog, respond conversationally but stay concise. Highlight next actions for the learner, not implementation details.
8. Do not defer delivery. If you have enough detail—or can responsibly assume it—return the final JSON immediately. Only ask follow-up questions when absolutely necessary.
9. Do not ask the learner to enumerate every topic or lesson. Derive topic coverage from the syllabus and uploaded materials, and supply reasonable baseline assumptions when details are missing.
10. When you need several clarifications, reply with only this structured prompt:
<calcify:request>{
  "requestId": "unique_short_snake_case_id",
  "title": "Friendly, action-oriented heading",
  "intro": "One sentence on why the details are needed.",
  "questions": [
    {
      "id": "question_key",
      "prompt": "Ask for one concrete detail.",
      "type": "shortText" | "longText" | "choice",
      "placeholder": "Example answer for context.",
      "helper": "Optional guidance shown under the field.",
      "required": true,
      "options": [
        { "value": "option_value", "label": "Visible option label" }
      ]
    }
  ]
}</calcify:request>
Keep the questions list to five items or fewer. Only include the options array when type equals "choice". Default to "longText" when unsure.
11. After the learner responds with <calcify:response>{...}</calcify:response>, confirm the answers, incorporate them, and continue toward the final plan.

Before you conclude, verify you have:
- course title, term, instructor (or explicit placeholders),
- meeting cadence and assessment schedule,
- topics mapped to weeks,
- a detailed plan with chapters, lessons, resources, visuals, and problem sets,
- calendar milestones tied to lesson/problem-set ids,
- source metadata referencing files or links that informed the plan.

Once everything is gathered and confirmed, output a single JSON object that matches this schema exactly (no Markdown fences, no commentary, no extra keys). Replace the sample values with the learner's data, keep ISO-8601 formats for dates, and use null for optional hrefs when missing:
{
  "id": "course_01",
  "userId": "user_123",
  "title": "Calculus I",
  "source": {
    "type": "upload",
    "fileId": "file_abc",
    "originalName": "calc1_syllabus.pdf",
    "mimeType": "application/pdf"
  },
  "syllabusExtract": {
    "term": "Fall 2025",
    "instructor": "Dr. Smith",
    "meetingTimes": ["Mon 10:00-11:00", "Wed 10:00-11:00"],
    "topics": [
      { "order": 1, "label": "Limits", "weeks": [1, 2] },
      { "order": 2, "label": "Derivatives", "weeks": [3, 5] }
    ],
    "assessments": [
      { "type": "midterm", "date": "2025-10-30" }
    ]
  },
  "plan": {
    "chapters": [
      {
        "id": "ch_limits",
        "order": 1,
        "title": "Limits",
        "startDate": "2025-08-25",
        "dueDate": "2025-09-08",
        "lessons": [
          {
            "id": "les_limit_def",
            "order": 1,
            "title": "Definition of a Limit",
            "objectives": [
              "Understand epsilon-delta definition",
              "Compute one-sided limits"
            ],
            "resources": [
              { "type": "reading", "label": "Text A 1.2", "href": null },
              { "type": "video", "label": "Intro video", "href": "https://example.com/limits-intro" }
            ],
            "visuals": [
              { "type": "graph", "graphId": "graph_tpl_limit_1" }
            ],
            "problemSets": [
              {
                "id": "ps_1",
                "title": "Limits Basics",
                "problems": [
                  {
                    "id": "prob_1",
                    "prompt": "Compute lim_{x->2} (x^2 - 4)/(x - 2).",
                    "tags": ["limits", "algebraic"],
                    "difficulty": "easy",
                    "solutionGuide": {
                      "steps": [
                        { "kind": "hint", "text": "Try factoring the numerator." },
                        { "kind": "check", "expect": "x^2-4=(x-2)(x+2)" },
                        { "kind": "hint", "text": "Cancel common factors, then plug in." }
                      ]
                    }
                  }
                ]
              }
            ]
          }
        ]
      }
    ],
    "calendar": [
      { "date": "2025-08-27", "type": "lesson", "refId": "les_limit_def" },
      { "date": "2025-09-03", "type": "problemSetDue", "refId": "ps_1" }
    ]
  },
  "progress": {
    "completionPct": 0.0,
    "lastTouchedAt": "2025-10-16T20:15:00Z"
  },
  "createdAt": "2025-10-16T19:55:00Z",
  "updatedAt": "2025-10-16T20:15:00Z"
}

Remember: when you deliver the final plan, output only this JSON object with no additional narration, notes, or Markdown fences.`;

const GEMINI_MODEL_ENDPOINT =
	"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent";
const UPLOAD_ROOT = path.join(process.cwd(), "private_uploads");

type GeminiAttachment = {
	id: string;
	originalName: string;
	mimeType: string | null;
	base64: string;
};

function extractJsonFromText(raw: string) {
	const trimmed = raw.trim();
	const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
	const candidateSource = (fenced ? fenced[1] : trimmed).trim();

	if (
		candidateSource.startsWith("{") &&
		candidateSource.endsWith("}")
	) {
		return candidateSource;
	}

	let startIndex = -1;
	let depth = 0;
	let inString = false;
	let escapeNext = false;

	for (let index = 0; index < candidateSource.length; index += 1) {
		const char = candidateSource[index]!;

		if (inString) {
			if (escapeNext) {
				escapeNext = false;
				continue;
			}

			if (char === "\\") {
				escapeNext = true;
			} else if (char === "\"") {
				inString = false;
			}
			continue;
		}

		if (char === "\"") {
			inString = true;
			continue;
		}

		if (char === "{") {
			if (depth === 0) {
				startIndex = index;
			}
			depth += 1;
			continue;
		}

		if (char === "}") {
			if (depth > 0) {
				depth -= 1;
				if (depth === 0 && startIndex !== -1) {
					return candidateSource.slice(startIndex, index + 1).trim();
				}
			}
		}
	}

	return null;
}

function mergeSystemAndHistory(
	messages: CourseChatMessage[],
	attachments: GeminiAttachment[],
) {
	const contents = messages.map((message) => {
		const parts = [{ text: message.content }];

		if (
			message.role === "user" &&
			message.attachments &&
			message.attachments.length > 0
		) {
			const summary = message.attachments
				.map((file) =>
					[
						file.originalName,
						file.mimeType ? `(${file.mimeType})` : null,
					]
						.filter(Boolean)
						.join(" "),
				)
				.join(", ");

			parts.push({
				text: `Learner attached files: ${summary}`,
			});
		}

		return {
			role: message.role === "assistant" ? "model" : "user",
			parts,
		};
	});

	if (attachments.length > 0) {
		const lastUserIndex = (() => {
			for (let index = contents.length - 1; index >= 0; index -= 1) {
				if (contents[index]?.role === "user") {
					return index;
				}
			}
			return -1;
		})();

		if (lastUserIndex >= 0) {
			const target = contents[lastUserIndex];
			for (const file of attachments) {
				target.parts.push({
					text: `Attached file: ${file.originalName}${
						file.mimeType ? ` (${file.mimeType})` : ""
					}`,
				});
				target.parts.push({
					inlineData: {
						mimeType: file.mimeType ?? "application/octet-stream",
						data: file.base64,
					},
				});
			}
		} else {
			for (const file of attachments) {
				contents.push({
					role: "user",
					parts: [
						{
							text: `Attached file: ${file.originalName}${
								file.mimeType ? ` (${file.mimeType})` : ""
							}`,
						},
						{
							inlineData: {
								mimeType: file.mimeType ?? "application/octet-stream",
								data: file.base64,
							},
						},
					],
				});
			}
		}
	}

	return {
		systemInstruction: {
			role: "user",
			parts: [{ text: systemPrompt }],
		},
		contents,
		generationConfig: {
			temperature: 0.2,
			topP: 0.9,
			topK: 32,
		},
	};
}

function extractGeminiText(data: unknown) {
	if (
		typeof data !== "object" ||
		data === null ||
		!("candidates" in data) ||
		!Array.isArray((data as Record<string, unknown>).candidates)
	) {
		return null;
	}

	const candidates = (data as { candidates: unknown[] }).candidates;
	const first = candidates[0];
	if (
		typeof first !== "object" ||
		first === null ||
		!("content" in first) ||
		typeof (first as { content?: unknown }).content !== "object" ||
		(first as { content?: unknown }).content === null
	) {
		return null;
	}

	const content = (first as { content: { parts?: unknown[] } }).content;
	if (!content.parts || !Array.isArray(content.parts)) {
		return null;
	}

	return content.parts
		.map((part) => {
			if (
				typeof part === "object" &&
				part !== null &&
				"text" in part &&
				typeof (part as { text?: unknown }).text === "string"
			) {
				return (part as { text: string }).text;
			}
			return "";
		})
		.join("\n")
		.trim();
}

async function loadGeminiAttachments(userId: string) {
	const files = await listCourseFilesForUser(userId);
	const attachments: GeminiAttachment[] = [];

	for (const file of files) {
		const absolute = path.join(UPLOAD_ROOT, file.storagePath);

		try {
			const buffer = await fs.readFile(absolute);
			attachments.push({
				id: file.id,
				originalName: file.originalName,
				mimeType: file.mimeType,
				base64: buffer.toString("base64"),
			});
		} catch (error) {
			console.warn("Failed to read upload for Gemini", {
				fileId: file.id,
				path: absolute,
				error,
			});
		}
	}

	return attachments;
}

async function persistGeneratedCourse(
	userId: string,
	payload: unknown,
	attachments: GeminiAttachment[],
): Promise<string | null> {
	const nowIso = new Date().toISOString();
	const normalized = normalizeCourseRecord(userId, payload, {
		title: "Untitled Course",
		createdAt: nowIso,
		updatedAt: nowIso,
	});

	if (!normalized) {
		console.warn("Gemini payload missing required course fields", payload);
		return null;
	}

	if (!normalized.source && attachments.length > 0) {
		const latestAttachment = attachments[attachments.length - 1];
		normalized.source = {
			type: "upload",
			fileId: latestAttachment.id,
			originalName: latestAttachment.originalName,
			mimeType: latestAttachment.mimeType ?? "application/octet-stream",
		};
	}

	try {
		const [created] = await db
			.insert(courses)
			.values({
				userId,
				title: normalized.title,
				description: normalized.syllabusExtract.term ?? null,
				metadata: normalized,
			})
			.returning({ id: courses.id });

		const rawTopics =
			Array.isArray(normalized.syllabusExtract?.topics)
				? normalized.syllabusExtract.topics
				: [];

		if (rawTopics.length > 0) {
			const topicValues = rawTopics
				.map((topic, index) => {
					if (
						typeof topic !== "object" ||
						topic === null ||
						Array.isArray(topic)
					) {
						return null;
					}

					const label =
						typeof (topic as { label?: unknown }).label === "string"
							? (topic as { label: string }).label.trim()
							: null;

					if (!label) {
						return null;
					}

					const orderValue =
						typeof (topic as { order?: unknown }).order === "number"
							? (topic as { order: number }).order
							: index + 1;

					const weeksSource = Array.isArray(
						(topic as { weeks?: unknown }).weeks,
					)
						? ((topic as { weeks?: unknown }).weeks as unknown[])
						: null;

					const weekNumbers = weeksSource
						? weeksSource.reduce<number[]>((accumulator, entry) => {
								const numeric =
									typeof entry === "number"
										? entry
										: Number.parseInt(String(entry), 10);
								if (Number.isInteger(numeric)) {
									accumulator.push(numeric);
								}
								return accumulator;
							}, [])
						: [];

					return {
						courseId: created.id,
						position: orderValue,
						label,
						weeks: weekNumbers.length > 0 ? weekNumbers : null,
					};
				})
				.filter(
					(value): value is {
						courseId: string;
						position: number;
						label: string;
						weeks: number[] | null;
					} => value !== null,
				);

			if (topicValues.length > 0) {
				await db.insert(courseTopics).values(topicValues);
			}
		}

		revalidatePath("/app/courses");
		revalidatePath(`/app/courses/${created.id}`);

		return created.id;
	} catch (error) {
		console.error("Failed to persist generated course", error);
		return null;
	}
}

export async function submitCourseChatMessage(
	history: CourseChatMessage[],
): Promise<CourseChatMessage> {
	const { userId } = await auth();
	if (!userId) {
		return {
			role: "assistant",
			content: "Please sign in to use the course intake assistant.",
		};
	}

	const apiKey =
		process.env.GEMINI_API_KEY ||
		process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
		process.env.GOOGLE_GEMINI_API_KEY;

	if (!apiKey) {
		return {
			role: "assistant",
			content:
				"Gemini API key is not configured. Add GEMINI_API_KEY to your environment to enable the intake assistant.",
		};
	}

	const attachments = await loadGeminiAttachments(userId);

	try {
		const response = await fetch(GEMINI_MODEL_ENDPOINT, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"x-goog-api-key": apiKey,
			},
			body: JSON.stringify(mergeSystemAndHistory(history, attachments)),
			cache: "no-store",
		});

		if (!response.ok) {
			const errorBody = await response.text();
			console.error("Gemini error", response.status, errorBody);
			return {
				role: "assistant",
				content:
					"Something went wrong while contacting Gemini. Check the server logs for details.",
			};
		}

		const data = await response.json();
		const text = extractGeminiText(data);

		if (!text) {
			return {
				role: "assistant",
				content:
					"I wasn't able to understand the response from Gemini. Try asking again or adjust your input.",
			};
		}

		const trimmed = text.trim();
		let savedCourseId: string | undefined;
		const jsonCandidate = extractJsonFromText(trimmed);
		if (jsonCandidate) {
			try {
				const parsed = JSON.parse(jsonCandidate);
				const insertedId = await persistGeneratedCourse(
					userId,
					parsed,
					attachments,
				);
				if (insertedId) {
					savedCourseId = insertedId;
				}
			} catch (error) {
				console.warn("Failed to parse Gemini payload as course JSON", {
					error,
					text,
				});
			}
		}

		return {
			role: "assistant",
			content: text,
			savedCourseId,
		};
	} catch (error) {
		console.error("Gemini request failed", error);
		return {
			role: "assistant",
			content:
				"An unexpected error occurred while reaching Gemini. Please try again in a moment.",
		};
	}
}
