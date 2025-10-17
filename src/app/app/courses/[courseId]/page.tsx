import Link from "next/link";
import { notFound } from "next/navigation";

import { getCourseById } from "../actions";
import { courseRowToRecord, type CourseRecord } from "../course-data";
import {
	buildReferenceMaps,
	capitalize,
	formatDate,
	formatDateTime,
	formatWeeks,
	renderProblemSets,
	renderResources,
} from "../course-helpers";

type CourseRouteParams = {
	courseId: string;
};

type CourseDetailPageProps = {
	params: CourseRouteParams | Promise<CourseRouteParams>;
};

function ensureCourseRecord(record: CourseRecord | null): CourseRecord {
	if (!record) {
		throw new Error("Course metadata missing.");
	}
	return record;
}

function renderSource(source: CourseRecord["source"] | undefined) {
	if (!source) {
		return (
			<p className="text-sm text-muted-foreground">
				Captured via chat conversation.
			</p>
		);
	}

	if (source.type === "upload") {
		return (
			<>
				<p className="font-medium text-foreground">{source.originalName}</p>
				<p className="text-xs text-muted-foreground">File ID: {source.fileId}</p>
				<p className="text-xs text-muted-foreground">{source.mimeType}</p>
			</>
		);
	}

	return (
		<a
			href={source.href}
			className="text-sm text-primary underline underline-offset-2 hover:text-primary/80"
			target="_blank"
			rel="noreferrer"
		>
			View source
		</a>
	);
}

export default async function CourseDetailPage({
	params,
}: CourseDetailPageProps) {
	const { courseId } = await params;
	const row = await getCourseById(courseId);

	if (!row) {
		notFound();
	}

	let course: CourseRecord;
	try {
		course = ensureCourseRecord(courseRowToRecord(row));
	} catch (error) {
		console.error("Failed to parse course metadata", error);
		notFound();
	}

	const progressPct = Math.round(course.progress.completionPct * 100);
	const referenceMaps = buildReferenceMaps(course);
	const source = course.source;
	const meetingTimes = course.syllabusExtract.meetingTimes ?? [];
	const topics = course.syllabusExtract.topics ?? [];
	const assessments = course.syllabusExtract.assessments ?? [];

	return (
		<main className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-12">
			<section className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-semibold">{course.title}</h1>
					<p className="mt-2 text-muted-foreground">
						{course.syllabusExtract.term} -{" "}
						<span className="font-medium">
							{course.syllabusExtract.instructor || "Instructor TBD"}
						</span>
					</p>
				</div>
				<Link
					href="/app/courses"
					className="text-sm text-primary underline underline-offset-4 hover:text-primary/80"
				>
					Back to courses
				</Link>
			</section>

			<section className="rounded-lg border border-border bg-card p-6 shadow-sm">
				<div className="grid gap-6 md:grid-cols-2">
					<div className="space-y-4">
						<div>
							<p className="text-sm font-medium text-muted-foreground">
								Source
							</p>
							<div className="mt-1 space-y-1 text-sm">
								{renderSource(source)}
							</div>
						</div>

						<div>
							<p className="text-sm font-medium text-muted-foreground">
								Assessments
							</p>
							{assessments.length === 0 ? (
								<p className="mt-2 text-xs text-muted-foreground">
									No assessments captured yet.
								</p>
							) : (
								<ul className="mt-2 space-y-1 text-sm text-muted-foreground">
									{assessments.map((assessment) => (
										<li key={`${assessment.type}-${assessment.date}`}>
											{capitalize(assessment.type)} -{" "}
											{formatDate(assessment.date)}
										</li>
									))}
								</ul>
							)}
						</div>
					</div>

					<div>
						<p className="text-sm font-medium text-muted-foreground">
							Meeting Times
						</p>
						{meetingTimes.length === 0 ? (
							<p className="mt-1 text-xs text-muted-foreground">Schedule TBD.</p>
						) : (
							<ul className="mt-1 text-sm text-muted-foreground">
								{meetingTimes.map((time) => (
									<li key={time}>{time}</li>
								))}
							</ul>
						)}

						<p className="mt-4 text-sm font-medium text-muted-foreground">
							Topics
						</p>
						{topics.length === 0 ? (
							<p className="mt-1 text-xs text-muted-foreground">
								Topics will appear once the assistant extracts them.
							</p>
						) : (
							<ul className="mt-2 space-y-2 text-sm">
								{topics.map((topic) => (
									<li
										key={topic.order}
										className="rounded-md border border-border/60 bg-muted/40 px-3 py-2"
									>
										<p className="font-medium">
											{topic.order}. {topic.label}
										</p>
										<p className="text-xs uppercase tracking-wide text-muted-foreground/80">
											{formatWeeks(topic.weeks)}
										</p>
									</li>
								))}
							</ul>
						)}
					</div>
				</div>
			</section>

			<section className="rounded-lg border border-border bg-card p-6 shadow-sm">
				<div className="space-y-2">
					<p className="text-sm font-medium text-muted-foreground">
						Progress
					</p>
					<div className="h-2 rounded-full bg-muted">
						<div
							className="h-full rounded-full bg-primary"
							style={{ width: `${progressPct}%` }}
							aria-hidden="true"
						/>
					</div>
					<p className="mt-2 text-xs text-muted-foreground">
						Last updated {formatDateTime(course.progress.lastTouchedAt)}
					</p>
				</div>
			</section>

			<section className="rounded-lg border border-border bg-card p-6 shadow-sm">
				<h2 className="text-xl font-semibold">Study Plan</h2>
				<p className="mt-2 text-sm text-muted-foreground">
					Chapters, lessons, and supporting resources automatically generated
					from the syllabus.
				</p>

				<div className="mt-6 space-y-6">
					{course.plan.chapters.map((chapter) => (
						<article
							key={chapter.id}
							className="rounded-lg border border-border/70 bg-background p-5 shadow-sm"
						>
							<header className="flex flex-col gap-2 border-b border-dashed border-border/50 pb-4 md:flex-row md:items-center md:justify-between">
								<div>
									<h3 className="text-lg font-semibold">
										{chapter.order}. {chapter.title}
									</h3>
									<p className="text-sm text-muted-foreground">
										{formatDate(chapter.startDate)} -{" "}
										{formatDate(chapter.dueDate)}
									</p>
								</div>
								<div className="flex items-center gap-3">
									<p className="rounded-md bg-muted px-3 py-1 text-xs uppercase tracking-wide text-muted-foreground/80">
										{chapter.lessons.length} lesson
										{chapter.lessons.length === 1 ? "" : "s"}
									</p>
									<Link
										href={`/app/courses/${row.id}/chapters/${chapter.id}`}
										className="text-xs font-medium text-primary underline underline-offset-4 hover:text-primary/80"
									>
										View chapter
									</Link>
								</div>
							</header>

							<div className="mt-4 space-y-6">
								{chapter.lessons.map((lesson) => (
									<div key={lesson.id} className="space-y-3">
										<div>
											<p className="text-base font-medium">{lesson.title}</p>
											<ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
												{lesson.objectives.map((objective) => (
													<li key={objective}>{objective}</li>
												))}
											</ul>
										</div>

										{lesson.resources.length > 0 ? (
											<div>
												<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
													Resources
												</p>
												<ul className="mt-2 space-y-1">
													{renderResources(lesson.resources)}
												</ul>
											</div>
										) : null}

										{renderProblemSets(lesson.problemSets)}
									</div>
								))}
							</div>
						</article>
					))}
				</div>
			</section>

			<section className="rounded-lg border border-border bg-card p-6 shadow-sm">
				<h2 className="text-xl font-semibold">Calendar</h2>
				<p className="mt-2 text-sm text-muted-foreground">
					Key dates pulled from the study plan and assessments.
				</p>

				<ul className="mt-6 space-y-4">
					{course.plan.calendar.map((event) => {
						const lessonRef = referenceMaps.lessons.get(event.refId);
						const problemSetRef = referenceMaps.problemSets.get(event.refId);
						const referenceLabel = lessonRef
							? `${lessonRef.title} - ${lessonRef.chapterTitle}`
							: problemSetRef
							? `${problemSetRef.title} - ${problemSetRef.lessonTitle}`
							: event.refId;

						return (
							<li
								key={`${event.date}-${event.refId}`}
								className="flex flex-col gap-2 rounded-md border border-border/70 bg-background px-4 py-3 md:flex-row md:items-center md:justify-between"
							>
								<div>
									<p className="text-sm font-medium">
										{formatDate(event.date)} - {capitalize(event.type)}
									</p>
									<p className="text-xs uppercase tracking-wide text-muted-foreground/80">
										{referenceLabel}
									</p>
								</div>
								<p className="text-xs text-muted-foreground">
									Ref ID: {event.refId}
								</p>
							</li>
						);
					})}
				</ul>
			</section>
		</main>
	);
}

export const dynamic = "force-dynamic";
