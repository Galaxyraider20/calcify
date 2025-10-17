"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
	Check,
	ChevronRight,
	FileText,
	Loader2,
	Paperclip,
	Send,
	Sparkles,
	X,
} from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";

import {
	submitCourseChatMessage,
	type CourseChatAttachment,
	type CourseChatMessage,
} from "./actions";

const initialMessage: CourseChatMessage = {
	role: "assistant",
	content:
		"Hi! I'm Calcify's course intake assistant. Share the course syllabus details you have, and I'll ask follow-up questions to build out the plan.",
};

type ParsedCourseSummary = {
	title: string;
	term?: string;
	instructor?: string;
};

type QuestionType = "shortText" | "longText" | "choice";

type ChoiceOption = {
	value: string;
	label: string;
};

type StructuredQuestion = {
	id: string;
	prompt: string;
	type: QuestionType;
	placeholder?: string;
	helper?: string;
	required: boolean;
	options?: ChoiceOption[];
};

type StructuredInfoRequest = {
	requestId: string;
	title: string;
	intro?: string;
	questions: StructuredQuestion[];
};

type StructuredInfoResponse = {
	requestId: string;
	title?: string;
	answers: {
		id: string;
		prompt?: string;
		response: string;
	}[];
};

type ParsedRequestResult = {
	request: StructuredInfoRequest;
	stripped: string;
};

type ParsedResponseResult = {
	response: StructuredInfoResponse;
	stripped: string;
};

const REQUEST_PREFIX = "<calcify:request>";
const REQUEST_SUFFIX = "</calcify:request>";
const RESPONSE_PREFIX = "<calcify:response>";
const RESPONSE_SUFFIX = "</calcify:response>";
const MAX_MESSAGE_ATTACHMENTS = 5;
const ACCEPTED_FILE_TYPES = ".pdf,.doc,.docx,.txt,.rtf";

function tryParseJson(content: string) {
	const trimmed = content.trim();
	if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) {
		return null;
	}

	try {
		return JSON.parse(trimmed) as unknown;
	} catch {
		return null;
	}
}

function extractSummary(data: unknown): ParsedCourseSummary | null {
	if (
		typeof data !== "object" ||
		data === null ||
		Array.isArray(data) ||
		typeof (data as { title?: unknown }).title !== "string"
	) {
		return null;
	}

	const record = data as {
		title: string;
		syllabusExtract?: { term?: string; instructor?: string };
	};

	return {
		title: record.title,
		term: record.syllabusExtract?.term,
		instructor: record.syllabusExtract?.instructor,
	};
}

function formatFileSize(bytes: number) {
	if (bytes < 1024) {
		return `${bytes} B`;
	}

	const kb = bytes / 1024;
	if (kb < 1024) {
		return `${kb.toFixed(1)} KB`;
	}

	const mb = kb / 1024;
	if (mb < 1024) {
		return `${mb.toFixed(2)} MB`;
	}

	const gb = mb / 1024;
	return `${gb.toFixed(2)} GB`;
}

function rebuildPlainText(before: string, after: string) {
	const trimmedBefore = before.trim();
	const trimmedAfter = after.trim();

	if (trimmedBefore && trimmedAfter) {
		return `${trimmedBefore}\n\n${trimmedAfter}`;
	}

	return trimmedBefore || trimmedAfter;
}

function parseEnvelope<T>(content: string, prefix: string, suffix: string) {
	const start = content.indexOf(prefix);
	if (start === -1) {
		return null;
	}

	const end = content.indexOf(suffix, start + prefix.length);
	if (end === -1) {
		return null;
	}

	const before = content.slice(0, start);
	const jsonText = content.slice(start + prefix.length, end).trim();
	const after = content.slice(end + suffix.length);

	try {
		const payload = JSON.parse(jsonText) as T;
		return { payload, before, after };
	} catch (error) {
		console.warn("Failed to parse structured envelope", { error, jsonText });
		return null;
	}
}

function normalizeQuestion(raw: unknown): StructuredQuestion | null {
	if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
		return null;
	}

	const candidate = raw as {
		id?: unknown;
		prompt?: unknown;
		type?: unknown;
		placeholder?: unknown;
		helper?: unknown;
		required?: unknown;
		options?: unknown;
	};

	if (typeof candidate.id !== "string" || typeof candidate.prompt !== "string") {
		return null;
	}

	let type: QuestionType = "longText";
	if (candidate.type === "shortText" || candidate.type === "choice") {
		type = candidate.type;
	} else if (candidate.type === "longText") {
		type = "longText";
	}

	const required =
		typeof candidate.required === "boolean" ? candidate.required : true;

	let options: ChoiceOption[] | undefined;
	if (type === "choice" && Array.isArray(candidate.options)) {
		const normalized = candidate.options
			.map((option) => {
				if (
					typeof option !== "object" ||
					option === null ||
					Array.isArray(option)
				) {
					return null;
				}

				const record = option as { value?: unknown; label?: unknown };
				if (typeof record.value !== "string" || typeof record.label !== "string") {
					return null;
				}

				return { value: record.value, label: record.label };
			})
			.filter((entry): entry is ChoiceOption => entry !== null);

		if (normalized.length > 0) {
			options = normalized;
		}
	}

	return {
		id: candidate.id,
		prompt: candidate.prompt,
		type,
		placeholder:
			typeof candidate.placeholder === "string" ? candidate.placeholder : undefined,
		helper: typeof candidate.helper === "string" ? candidate.helper : undefined,
		required,
		options,
	};
}

function parseInfoRequest(content: string): ParsedRequestResult | null {
	const result = parseEnvelope<unknown>(content, REQUEST_PREFIX, REQUEST_SUFFIX);
	if (!result) {
		return null;
	}

	const { payload, before, after } = result;
	if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
		return null;
	}

	const record = payload as {
		requestId?: unknown;
		title?: unknown;
		intro?: unknown;
		questions?: unknown;
	};

	if (
		typeof record.requestId !== "string" ||
		typeof record.title !== "string" ||
		!Array.isArray(record.questions)
	) {
		return null;
	}

	const questions = record.questions
		.map((entry) => normalizeQuestion(entry))
		.filter((question): question is StructuredQuestion => question !== null);

	if (questions.length === 0) {
		return null;
	}

	return {
		request: {
			requestId: record.requestId,
			title: record.title,
			intro: typeof record.intro === "string" ? record.intro : undefined,
			questions,
		},
		stripped: rebuildPlainText(before, after),
	};
}

function parseInfoResponse(content: string): ParsedResponseResult | null {
	const result = parseEnvelope<unknown>(content, RESPONSE_PREFIX, RESPONSE_SUFFIX);
	if (!result) {
		return null;
	}

	const { payload, before, after } = result;
	if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
		return null;
	}

	const record = payload as {
		requestId?: unknown;
		title?: unknown;
		answers?: unknown;
	};

	if (typeof record.requestId !== "string" || !Array.isArray(record.answers)) {
		return null;
	}

	const answers = record.answers
		.map((entry) => {
			if (
				typeof entry !== "object" ||
				entry === null ||
				Array.isArray(entry)
			) {
				return null;
			}

			const answer = entry as {
				id?: unknown;
				prompt?: unknown;
				response?: unknown;
			};

			if (typeof answer.id !== "string") {
				return null;
			}

			const responseValue =
				answer.response === undefined || answer.response === null
					? ""
					: String(answer.response);

			return {
				id: answer.id,
				prompt: typeof answer.prompt === "string" ? answer.prompt : undefined,
				response: responseValue,
			};
		})
		.filter(
			(entry): entry is StructuredInfoResponse["answers"][number] =>
				entry !== null,
		);

	if (answers.length === 0) {
		return null;
	}

	return {
		response: {
			requestId: record.requestId,
			title: typeof record.title === "string" ? record.title : undefined,
			answers,
		},
		stripped: rebuildPlainText(before, after),
	};
}

function MessageAttachments({
	attachments,
}: {
	attachments: CourseChatAttachment[];
}) {
	if (attachments.length === 0) {
		return null;
	}

	return (
		<div className="flex flex-col gap-2 rounded-2xl border border-border/60 bg-background/80 p-3 text-xs shadow-sm">
			<p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
				Attachments
			</p>
			<div className="flex flex-col gap-2">
				{attachments.map((file) => (
					<div
						key={file.id}
						className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/40 px-3 py-2"
					>
						<div className="flex items-center gap-3">
							<span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
								<FileText className="h-4 w-4" aria-hidden="true" />
							</span>
							<div>
								<p className="text-sm font-medium text-foreground">
									{file.originalName}
								</p>
								<p className="text-[11px] text-muted-foreground">
									{file.mimeType ?? "unknown"} | {formatFileSize(file.sizeBytes)}
								</p>
							</div>
						</div>
						<span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
							Saved
						</span>
					</div>
				))}
			</div>
		</div>
	);
}

function PendingAttachmentList({
	attachments,
	onRemove,
}: {
	attachments: CourseChatAttachment[];
	onRemove: (attachment: CourseChatAttachment) => void;
}) {
	if (attachments.length === 0) {
		return null;
	}

	return (
		<div className="flex flex-wrap gap-2">
			{attachments.map((file) => (
				<span
					key={file.id}
					className="group inline-flex items-center gap-2 rounded-xl border border-border/60 bg-muted/40 px-3 py-2 text-xs text-foreground transition hover:border-primary/60"
				>
					<FileText className="h-4 w-4 text-primary" aria-hidden="true" />
					<span className="max-w-[10rem] truncate font-medium">
						{file.originalName}
					</span>
					<span className="text-[10px] text-muted-foreground">
						{formatFileSize(file.sizeBytes)}
					</span>
					<button
						type="button"
						onClick={() => onRemove(file)}
						className="flex h-5 w-5 items-center justify-center rounded-full border border-transparent text-muted-foreground transition hover:border-destructive/40 hover:text-destructive"
						aria-label={`Remove ${file.originalName}`}
					>
						<X className="h-3 w-3" aria-hidden="true" />
					</button>
				</span>
			))}
		</div>
	);
}

export default function CourseChat() {
	const [messages, setMessages] = useState<CourseChatMessage[]>([initialMessage]);
	const [input, setInput] = useState("");
	const [isPending, startTransition] = useTransition();
	const [pendingUploads, setPendingUploads] = useState<CourseChatAttachment[]>(
		[],
	);
	const [isUploading, setIsUploading] = useState(false);
	const [uploadError, setUploadError] = useState<string | null>(null);

	const [queuedRequest, setQueuedRequest] = useState<StructuredInfoRequest | null>(
		null,
	);
	const [isRequestOpen, setIsRequestOpen] = useState(false);
	const [requestAnswers, setRequestAnswers] = useState<Record<string, string>>(
		{},
	);
	const [requestStep, setRequestStep] = useState(0);
	const [requestError, setRequestError] = useState<string | null>(null);
	const [completedRequestIds, setCompletedRequestIds] = useState<
		Record<string, boolean>
	>({});
	const [redirectedCourseId, setRedirectedCourseId] = useState<string | null>(
		null,
	);

	const router = useRouter();

	const scrollRef = useRef<HTMLDivElement>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		const node = scrollRef.current;
		if (!node) {
			return;
		}
		node.scrollTop = node.scrollHeight;
	}, [messages, isPending]);

	useEffect(() => {
		const lastMessage = messages[messages.length - 1];
		if (!lastMessage || lastMessage.role !== "assistant") {
			return;
		}

		const parsed = parseInfoRequest(lastMessage.content);
		if (!parsed) {
			return;
		}

		if (completedRequestIds[parsed.request.requestId]) {
			return;
		}

		if (
			queuedRequest &&
			queuedRequest.requestId === parsed.request.requestId
		) {
			if (!isRequestOpen) {
				setIsRequestOpen(true);
			}
			return;
		}

		setQueuedRequest(parsed.request);
		setRequestAnswers({});
		setRequestStep(0);
		setRequestError(null);
		setIsRequestOpen(true);
	}, [messages, completedRequestIds, queuedRequest, isRequestOpen]);

	useEffect(() => {
		const lastWithCourse = [...messages]
			.reverse()
			.find((message) => Boolean(message.savedCourseId));
		if (!lastWithCourse || !lastWithCourse.savedCourseId) {
			return;
		}

		if (redirectedCourseId === lastWithCourse.savedCourseId) {
			return;
		}

		setRedirectedCourseId(lastWithCourse.savedCourseId);
		router.push(`/app/courses/${lastWithCourse.savedCourseId}`);
	}, [messages, redirectedCourseId, router]);

	const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const trimmed = input.trim();
		if (!trimmed && pendingUploads.length === 0) {
			return;
		}

		const attachmentsForMessage =
			pendingUploads.length > 0
				? pendingUploads.map((file) => ({ ...file }))
				: undefined;

		const baseContent = trimmed || "Sharing files for reference.";
		const attachmentsNote =
			attachmentsForMessage && attachmentsForMessage.length > 0
				? `\n\nAttachments shared: ${attachmentsForMessage
						.map(
							(file) =>
								`${file.originalName} (${formatFileSize(file.sizeBytes)})`,
						)
						.join(", ")}`
				: "";

		const userMessage: CourseChatMessage = {
			role: "user",
			content: `${baseContent}${attachmentsNote}`,
			attachments: attachmentsForMessage,
		};

		const nextHistory = [...messages, userMessage];
		setMessages(nextHistory);
		setInput("");
		setPendingUploads([]);
		setUploadError(null);

		startTransition(async () => {
			const reply = await submitCourseChatMessage(nextHistory);
			setMessages((current) => [...current, reply]);
		});
	};

	const handleFileSelection = async (fileList: FileList | null) => {
		if (!fileList || fileList.length === 0 || isUploading) {
			return;
		}

		if (pendingUploads.length + fileList.length > MAX_MESSAGE_ATTACHMENTS) {
			setUploadError(
				`You can attach up to ${MAX_MESSAGE_ATTACHMENTS} files per message.`,
			);
			if (fileInputRef.current) {
				fileInputRef.current.value = "";
			}
			return;
		}

		setIsUploading(true);
		setUploadError(null);

		const freshAttachments: CourseChatAttachment[] = [];

		try {
			for (const file of Array.from(fileList)) {
				const formData = new FormData();
				formData.append("file", file);

				const response = await fetch("/api/course-uploads", {
					method: "POST",
					body: formData,
				});

				if (!response.ok) {
					const message = await response.text();
					throw new Error(
						message || `Failed to upload ${file.name}. Please try again.`,
					);
				}

				const data = (await response.json()) as {
					file: CourseChatAttachment & { storagePath?: string };
				};

				freshAttachments.push({
					id: data.file.id,
					originalName: data.file.originalName,
					mimeType: data.file.mimeType,
					sizeBytes: data.file.sizeBytes,
					createdAt: data.file.createdAt,
				});
			}

			if (freshAttachments.length > 0) {
				setPendingUploads((prev) => [...prev, ...freshAttachments]);
			}
		} catch (error) {
			console.error(error);
			setUploadError(
				error instanceof Error
					? error.message
					: "Something went wrong while uploading. Try again.",
			);
		} finally {
			if (fileInputRef.current) {
				fileInputRef.current.value = "";
			}
			setIsUploading(false);
		}
	};

	const handleRemoveAttachment = async (attachment: CourseChatAttachment) => {
		setPendingUploads((prev) =>
			prev.filter((file) => file.id !== attachment.id),
		);

		try {
			await fetch("/api/course-uploads", {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ id: attachment.id }),
			});
		} catch (error) {
			console.warn("Failed to delete attachment", error);
		}
	};

	const activeQuestion =
		queuedRequest && queuedRequest.questions[requestStep];

	const handleRequestAnswerChange = (
		question: StructuredQuestion,
		value: string,
	) => {
		setRequestAnswers((prev) => ({ ...prev, [question.id]: value }));
		setRequestError(null);
	};

	const submitStructuredResponses = (
		request: StructuredInfoRequest,
		answers: Record<string, string>,
	) => {
		const normalizedAnswers = request.questions.map((question) => ({
			id: question.id,
			prompt: question.prompt,
			response: (answers[question.id] ?? "").trim(),
		}));

		const payload: StructuredInfoResponse = {
			requestId: request.requestId,
			title: request.title,
			answers: normalizedAnswers,
		};

		const responseMessage: CourseChatMessage = {
			role: "user",
			content: `${RESPONSE_PREFIX}${JSON.stringify(payload)}${RESPONSE_SUFFIX}`,
		};

		const nextHistory = [...messages, responseMessage];
		setMessages(nextHistory);
		setCompletedRequestIds((prev) => ({
			...prev,
			[request.requestId]: true,
		}));
		setQueuedRequest(null);
		setIsRequestOpen(false);
		setRequestAnswers({});
		setRequestStep(0);
		setRequestError(null);

		startTransition(async () => {
			const reply = await submitCourseChatMessage(nextHistory);
			setMessages((current) => [...current, reply]);
		});
	};

	const handleRequestNext = () => {
		if (!queuedRequest || !activeQuestion) {
			return;
		}

		const raw = requestAnswers[activeQuestion.id] ?? "";
		const value =
			activeQuestion.type === "choice" ? raw : raw.trim();

		if (activeQuestion.required && value.length === 0) {
			setRequestError("Please provide an answer before continuing.");
			return;
		}

		const updatedAnswers = {
			...requestAnswers,
			[activeQuestion.id]: value,
		};
		setRequestAnswers(updatedAnswers);
		setRequestError(null);

		if (requestStep < queuedRequest.questions.length - 1) {
			setRequestStep((step) => step + 1);
		} else {
			submitStructuredResponses(queuedRequest, updatedAnswers);
		}
	};

	const handleSkipQuestion = () => {
		if (!queuedRequest || !activeQuestion || activeQuestion.required) {
			return;
		}

		const updatedAnswers = { ...requestAnswers, [activeQuestion.id]: "" };
		setRequestAnswers(updatedAnswers);
		setRequestError(null);

		if (requestStep < queuedRequest.questions.length - 1) {
			setRequestStep((step) => step + 1);
		} else {
			submitStructuredResponses(queuedRequest, updatedAnswers);
		}
	};

	const handleRequestBack = () => {
		if (requestStep === 0) {
			return;
		}
		setRequestStep((step) => Math.max(0, step - 1));
		setRequestError(null);
	};

	const renderRequestDialog = () => {
		if (!queuedRequest || !isRequestOpen || !activeQuestion) {
			return null;
		}

		const progress =
			((requestStep + 1) / queuedRequest.questions.length) * 100;

		return (
			<div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-10">
				<div
					className="absolute inset-0 bg-background/70 backdrop-blur-sm"
					onClick={() => setIsRequestOpen(false)}
				/>
				<div className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-background via-background to-muted/40 shadow-2xl">
					<div className="flex items-start justify-between gap-4 border-b border-primary/20 bg-primary/5 px-6 py-5">
						<div>
							<p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-primary">
								Calcify needs a detail
							</p>
							<p className="mt-2 text-lg font-semibold text-foreground">
								{queuedRequest.title}
							</p>
							{queuedRequest.intro ? (
								<p className="mt-1 text-sm text-muted-foreground">
									{queuedRequest.intro}
								</p>
							) : null}
						</div>
						<button
							type="button"
							onClick={() => setIsRequestOpen(false)}
							className="rounded-full border border-transparent bg-primary/10 p-2 text-primary transition hover:bg-primary/20"
							aria-label="Close request dialog"
						>
							<X className="h-4 w-4" aria-hidden="true" />
						</button>
					</div>

					<div className="space-y-6 px-6 py-6">
						<div className="space-y-2">
							<div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
								<span>
									Question {requestStep + 1} / {queuedRequest.questions.length}
								</span>
								<span>{Math.round(progress)}% complete</span>
							</div>
							<div className="h-2 rounded-full bg-muted">
								<div
									className="h-full rounded-full bg-primary transition-all"
									style={{ width: `${progress}%` }}
									aria-hidden="true"
								/>
							</div>
						</div>

						<div className="space-y-3">
							<p className="text-base font-semibold text-foreground">
								{activeQuestion.prompt}
							</p>
							{activeQuestion.helper ? (
								<p className="text-sm text-muted-foreground">
									{activeQuestion.helper}
								</p>
							) : null}

							{activeQuestion.type === "choice" && activeQuestion.options ? (
								<div className="grid gap-2">
									{activeQuestion.options.map((option) => {
										const selected =
											requestAnswers[activeQuestion.id] === option.value;
										return (
											<button
												key={option.value}
												type="button"
												onClick={() =>
													handleRequestAnswerChange(activeQuestion, option.value)
												}
												className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm transition ${
													selected
														? "border-primary bg-primary/10 text-primary"
														: "border-border/60 text-foreground hover:border-primary/50"
												}`}
											>
												<span>{option.label}</span>
												{selected ? (
													<Check className="h-4 w-4" aria-hidden="true" />
												) : null}
											</button>
										);
									})}
								</div>
							) : activeQuestion.type === "shortText" ? (
								<input
									type="text"
									value={requestAnswers[activeQuestion.id] ?? ""}
									onChange={(event) =>
										handleRequestAnswerChange(
											activeQuestion,
											event.target.value,
										)
									}
									placeholder={activeQuestion.placeholder}
									className="w-full rounded-xl border border-border/60 bg-background/80 px-4 py-3 text-sm text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
									disabled={isPending}
								/>
							) : (
								<textarea
									rows={5}
									value={requestAnswers[activeQuestion.id] ?? ""}
									onChange={(event) =>
										handleRequestAnswerChange(
											activeQuestion,
											event.target.value,
										)
									}
									placeholder={activeQuestion.placeholder}
									className="w-full rounded-xl border border-border/60 bg-background/80 px-4 py-3 text-sm text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
									disabled={isPending}
								/>
							)}
						</div>

						{requestError ? (
							<p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
								{requestError}
							</p>
						) : null}

						<div className="flex items-center justify-between gap-3">
							<button
								type="button"
								onClick={handleRequestBack}
								disabled={requestStep === 0 || isPending}
								className="rounded-xl border border-border/60 bg-background/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground transition hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
							>
								Back
							</button>

							<div className="flex items-center gap-3">
								{!activeQuestion.required ? (
									<button
										type="button"
										onClick={handleSkipQuestion}
										className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary transition hover:bg-primary/20"
									>
										Skip
									</button>
								) : null}
								<button
									type="button"
									onClick={handleRequestNext}
									disabled={isPending}
									className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground shadow-lg transition hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
								>
									{requestStep === queuedRequest.questions.length - 1
										? "Submit answers"
										: "Next question"}
									{isPending ? (
										<Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
									) : (
										<ChevronRight className="h-4 w-4" aria-hidden="true" />
									)}
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	};

	return (
		<div className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-b from-background/80 via-background to-muted/30 shadow-xl backdrop-blur">
			{renderRequestDialog()}

			<div className="flex items-center justify-between border-b border-border/60 px-6 py-5">
				<div className="flex items-center gap-3">
					<span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
						<Sparkles className="h-6 w-6" aria-hidden="true" />
					</span>
					<div className="space-y-1">
						<p className="text-sm font-semibold tracking-wide text-foreground">
							Calcify Assistant
						</p>
						<p className="text-xs text-muted-foreground">
							Let&apos;s shape this course together.
						</p>
					</div>
				</div>
				<div className="flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs text-muted-foreground">
					<span className="relative flex h-2 w-2">
						<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
						<span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
					</span>
					Live
				</div>
			</div>

			<div
				ref={scrollRef}
				className="flex max-h-[28rem] min-h-[22rem] flex-col gap-4 overflow-y-auto px-6 py-6 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border/70"
				aria-live="polite"
			>
				{messages.map((message, index) => {
					const assistant = message.role === "assistant";
					const requestMatch = assistant ? parseInfoRequest(message.content) : null;
					const responseMatch = !assistant
						? parseInfoResponse(message.content)
						: null;

					const baseContent = requestMatch
						? requestMatch.stripped
						: responseMatch
						? responseMatch.stripped
						: message.content;

					const displayContent = baseContent.trim();
					const parsedJson = assistant ? tryParseJson(displayContent) : null;
					const summary =
						assistant && message.savedCourseId
							? extractSummary(parsedJson)
							: null;
					const isJsonPayload = assistant && parsedJson !== null;

					const isRequestCompleted = requestMatch
						? completedRequestIds[requestMatch.request.requestId] ?? false
						: false;

					return (
						<div
							key={`message-${index}`}
							className={`flex ${assistant ? "justify-start" : "justify-end"}`}
						>
							<div className="flex max-w-[80%] flex-col gap-3">
								<div
									className={`relative rounded-3xl px-5 py-3 text-sm shadow-sm ring-1 ring-inset ${
										assistant
											? "bg-primary/10 text-foreground ring-primary/20"
											: "bg-primary text-primary-foreground ring-primary/50"
									}`}
								>
									<span
										className={`block text-[10px] uppercase tracking-[0.2em] ${
											assistant
												? "text-primary/80"
												: "text-primary-foreground/80"
										}`}
									>
										{assistant ? "Calcify" : "You"}
									</span>

									{isJsonPayload ? (
										<p className="mt-2 whitespace-pre-wrap leading-relaxed">
											I&apos;ve generated the baseline course plan and saved it to
											your library.
										</p>
									) : displayContent ? (
										<p className="mt-2 whitespace-pre-wrap leading-relaxed">
											{displayContent}
										</p>
									) : assistant && requestMatch ? (
										<p className="mt-2 whitespace-pre-wrap leading-relaxed">
											{requestMatch.request.intro ??
												"I just need a few extra details before finishing."}
										</p>
									) : !assistant && responseMatch ? (
										<p className="mt-2 whitespace-pre-wrap leading-relaxed">
											Here are the answers you requested.
										</p>
									) : null}
								</div>

								{requestMatch ? (
									<div
										className={`rounded-3xl border ${
											isRequestCompleted
												? "border-emerald-400/50 bg-emerald-500/10"
												: "border-primary/40 bg-primary/10"
										} px-4 py-4 text-sm shadow-inner`}
									>
										<div className="flex flex-wrap items-center justify-between gap-3">
											<div>
												<p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-primary">
													{isRequestCompleted
														? "Prompt completed"
														: "Assistant needs details"}
												</p>
												<p className="mt-1 text-sm font-semibold text-foreground">
													{requestMatch.request.title}
												</p>
											</div>
											{isRequestCompleted ? (
												<span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-200">
													<Check className="h-3.5 w-3.5" aria-hidden="true" />
													Saved
												</span>
											) : (
												<button
													type="button"
													onClick={() => {
														setQueuedRequest(requestMatch.request);
														setIsRequestOpen(true);
													}}
													className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary transition hover:bg-primary/20"
												>
													Answer now
													<ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
												</button>
											)}
										</div>
										{requestMatch.request.intro ? (
											<p className="mt-3 text-xs text-muted-foreground">
												{requestMatch.request.intro}
											</p>
										) : null}
										<p className="mt-3 text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
											{requestMatch.request.questions.length} question
											{requestMatch.request.questions.length === 1 ? "" : "s"}
										</p>
									</div>
								) : null}

								{responseMatch ? (
									<div className="rounded-3xl border border-emerald-300/50 bg-emerald-500/10 px-4 py-4 text-sm shadow-inner">
										<p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-emerald-500">
											Shared details
										</p>
										<ul className="mt-3 space-y-2 text-xs text-foreground/90">
											{responseMatch.response.answers.map((answer) => (
												<li
													key={answer.id}
													className="rounded-xl border border-emerald-300/40 bg-background/60 px-3 py-2"
												>
													<p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
														{answer.prompt ?? answer.id}
													</p>
													<p className="mt-1 whitespace-pre-wrap text-sm text-foreground">
														{answer.response || "No answer provided."}
													</p>
												</li>
											))}
										</ul>
									</div>
								) : null}

								{!assistant && message.attachments && message.attachments.length > 0 ? (
									<MessageAttachments attachments={message.attachments} />
								) : null}

								{summary ? (
									<div className="rounded-3xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-900 shadow-inner dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200">
										<p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-emerald-500">
											Course saved
										</p>
										<p className="mt-1 text-sm font-semibold text-foreground">
											{summary.title}
										</p>
										<p className="text-xs text-muted-foreground">
											{[summary.term, summary.instructor]
												.filter(Boolean)
												.join(" - ") || "Details captured"}
										</p>
										{message.savedCourseId ? (
											<Link
												href={`/app/courses/${message.savedCourseId}`}
												className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-4 py-2 text-xs font-medium text-emerald-700 transition hover:bg-emerald-500/30 dark:text-emerald-200"
											>
												View full plan
											</Link>
										) : null}
									</div>
								) : null}
							</div>
						</div>
					);
				})}

				{isPending ? (
					<div className="flex justify-start">
						<div className="flex items-center gap-2 rounded-3xl border border-primary/20 bg-primary/5 px-5 py-3 text-sm text-muted-foreground shadow-sm">
							<Loader2 className="h-4 w-4 animate-spin text-primary" />
							<span>Assistant is thinking...</span>
						</div>
					</div>
				) : null}
			</div>

			<form
				onSubmit={handleSubmit}
				className="border-t border-border/60 bg-background/80 px-6 py-5 backdrop-blur-sm"
			>
				<label className="flex flex-col gap-3 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
					Message
					<PendingAttachmentList
						attachments={pendingUploads}
						onRemove={handleRemoveAttachment}
					/>
					{uploadError ? (
						<p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-[11px] text-destructive">
							{uploadError}
						</p>
					) : null}
					<div className="flex items-end gap-3 rounded-2xl border border-border/60 bg-background/70 p-3 shadow-sm focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
						<textarea
							name="message"
							rows={3}
							value={input}
							onChange={(event) => setInput(event.target.value)}
							placeholder="Draft your course goals, timeline, assessments..."
							className="h-24 w-full resize-none rounded-xl border-none bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/70"
							disabled={isPending}
						/>
						<div className="flex flex-col items-end gap-2">
							<label
								className={`flex h-10 w-10 items-center justify-center rounded-xl border border-border/60 bg-background/80 text-muted-foreground transition hover:border-primary/40 hover:text-primary ${
									isUploading ? "pointer-events-none opacity-60" : ""
								}`}
							>
								<input
									ref={fileInputRef}
									type="file"
									className="hidden"
									accept={ACCEPTED_FILE_TYPES}
									multiple
									onChange={(event) => handleFileSelection(event.target.files)}
									disabled={isUploading || isPending}
								/>
								{isUploading ? (
									<Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
								) : (
									<Paperclip className="h-4 w-4" aria-hidden="true" />
								)}
								<span className="sr-only">Attach files</span>
							</label>
							<button
								type="submit"
								className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg transition hover:scale-105 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
								disabled={isPending || isUploading}
								aria-label="Send message"
							>
								{isPending ? (
									<Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
								) : (
									<Send className="h-4 w-4" aria-hidden="true" />
								)}
							</button>
						</div>
					</div>
				</label>
			</form>
		</div>
	);
}
