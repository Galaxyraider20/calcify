import Link from "next/link";
import { ArrowLeft, CheckCircle2, Sparkles, UploadCloud } from "lucide-react";

import CourseChat from "./course-chat";
import CourseFileUploader from "./course-file-uploader";

export default function CreateNewCoursePage() {
	return (
		<main className="relative mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 py-16">
			<div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,_rgba(99,102,241,0.16),_transparent_45%),radial-gradient(circle_at_bottom_left,_rgba(56,189,248,0.12),_transparent_40%)]" />

			<div className="flex flex-wrap items-center justify-between gap-4">
				<Link
					href="/app/courses"
					className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-primary"
				>
					<ArrowLeft className="h-4 w-4" />
					Back to courses
				</Link>
				<span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-primary">
					Live Preview
				</span>
			</div>

			<section className="grid gap-10 rounded-3xl border border-border/60 bg-background/95 p-10 shadow-2xl backdrop-blur lg:grid-cols-[1.25fr,0.9fr]">
				<div className="space-y-6">
					<div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1 text-xs font-semibold text-primary">
						<Sparkles className="h-4 w-4" />
						Guided Course Builder
					</div>
					<h1 className="text-4xl font-semibold tracking-tight text-foreground lg:text-5xl">
						Create a New Course
					</h1>
					<p className="text-base text-muted-foreground">
						The assistant will gather syllabus details, surface assessments, and
						assemble a complete plan for your learners, all from one chat.
					</p>
					<p className="text-base text-muted-foreground">
						Drop in the materials you already have, fill in the gaps with
						conversation, and watch Calcify stitch everything into a structured
						course outline.
					</p>
				</div>

				<div className="space-y-5">
					<h2 className="text-lg font-semibold text-foreground">
						How the assistant works
					</h2>
					<ul className="grid gap-4 text-sm text-muted-foreground">
						<li className="flex items-start gap-3 rounded-2xl border border-border/60 bg-muted/40 p-4 shadow-sm">
							<span className="mt-1 rounded-lg bg-primary/10 p-2 text-primary">
								<CheckCircle2 className="h-4 w-4" aria-hidden="true" />
							</span>
							<div>
								<p className="font-medium text-foreground">Share context</p>
								<p>
									Answer prompts with course goals, schedules, and expectations
									so the assistant understands your teaching style.
								</p>
							</div>
						</li>
						<li className="flex items-start gap-3 rounded-2xl border border-border/60 bg-muted/40 p-4 shadow-sm">
							<span className="mt-1 rounded-lg bg-primary/10 p-2 text-primary">
								<UploadCloud className="h-4 w-4" aria-hidden="true" />
							</span>
							<div>
								<p className="font-medium text-foreground">Upload references</p>
								<p>
									Syllabus PDFs, rubrics, and readings are parsed instantly and
									sent to Gemini with every message.
								</p>
							</div>
						</li>
						<li className="flex items-start gap-3 rounded-2xl border border-border/60 bg-muted/40 p-4 shadow-sm">
							<span className="mt-1 rounded-lg bg-primary/10 p-2 text-primary">
								<CheckCircle2 className="h-4 w-4" aria-hidden="true" />
							</span>
							<div>
								<p className="font-medium text-foreground">Review & publish</p>
								<p>
									The final JSON summary is saved directly to your library,
									including lessons, assessments, and calendar milestones.
								</p>
							</div>
						</li>
					</ul>
				</div>
			</section>

			<section className="grid gap-12 lg:grid-cols-[1.1fr,0.9fr]">
				<div className="space-y-6">
					<header className="space-y-2">
						<h2 className="text-2xl font-semibold text-foreground">
							Assistant Preview
						</h2>
						<p className="text-sm text-muted-foreground">
							Use the chat to test the intake flow. Responses come from Gemini
							when the API key is configured.
						</p>
					</header>
					<CourseChat />
				</div>

				<div className="space-y-6">
					<header className="space-y-2">
						<h2 className="text-2xl font-semibold text-foreground">
							Course Materials
						</h2>
						<p className="text-sm text-muted-foreground">
							Drop in syllabus files or references so the assistant can parse
							them later.
						</p>
					</header>
					<div className="rounded-3xl border border-border/60 bg-background/90 p-6 shadow-xl backdrop-blur">
						<CourseFileUploader />
					</div>
				</div>
			</section>
		</main>
	);
}
