"use client";

import Link from "next/link";
import { Loader2, Send, Sparkles } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";

import { submitCourseChatMessage, type CourseChatMessage } from "./actions";

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

export default function CourseChat() {
	const [messages, setMessages] = useState<CourseChatMessage[]>([
		initialMessage,
	]);
	const [input, setInput] = useState("");
	const [isPending, startTransition] = useTransition();
	const scrollRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const node = scrollRef.current;
		if (!node) {
			return;
		}
		node.scrollTop = node.scrollHeight;
	}, [messages, isPending]);

	const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const trimmed = input.trim();
		if (!trimmed) {
			return;
		}

		const userMessage: CourseChatMessage = {
			role: "user",
			content: trimmed,
		};
		const nextHistory: CourseChatMessage[] = [...messages, userMessage];
		setMessages(nextHistory);
		setInput("");

		startTransition(async () => {
			const reply = await submitCourseChatMessage(nextHistory);
			setMessages((current) => [...current, reply]);
		});
	};

	const isAssistant = (role: CourseChatMessage["role"]) => role === "assistant";

	return (
		<div className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-b from-background/80 via-background to-muted/30 shadow-xl backdrop-blur">
			<div className="flex items-center justify-between border-b border-border/60 px-6 py-5">
				<div className="flex items-center gap-3">
					<span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
						<Sparkles className="h-6 w-6" />
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
					const assistant = isAssistant(message.role);
					const parsedJson = assistant ? tryParseJson(message.content) : null;
					const summary =
						assistant && message.savedCourseId
							? extractSummary(parsedJson)
							: null;

					return (
						<div
							key={`${message.role}-${index}`}
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
									{parsedJson ? (
										<pre className="mt-2 whitespace-pre-wrap font-mono text-xs leading-relaxed">
											{JSON.stringify(parsedJson, null, 2)}
										</pre>
									) : (
										<p className="mt-2 whitespace-pre-wrap leading-relaxed">
											{message.content}
										</p>
									)}
								</div>

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
						<button
							type="submit"
							className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg transition hover:scale-105 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
							disabled={isPending}
							aria-label="Send message"
						>
							{isPending ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : (
								<Send className="h-4 w-4" />
							)}
						</button>
					</div>
				</label>
			</form>
		</div>
	);
}
