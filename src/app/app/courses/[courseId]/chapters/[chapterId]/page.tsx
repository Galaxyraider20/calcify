import Link from "next/link";
import { notFound } from "next/navigation";

import { getCourseById } from "../../../actions";
import { courseRowToRecord } from "../../../course-data";
import {
	capitalize,
	formatDate,
	renderProblemSets,
	renderResources,
} from "../../../course-helpers";

type ChapterRouteParams = {
	courseId: string;
	chapterId: string;
};

type ChapterPageProps = {
	params: ChapterRouteParams | Promise<ChapterRouteParams>;
};

export default async function ChapterDetailPage({ params }: ChapterPageProps) {
	const { courseId, chapterId } = await params;
	const row = await getCourseById(courseId);
	if (!row) {
		notFound();
	}

	const course = courseRowToRecord(row);
	if (!course) {
		notFound();
	}

	const chapter = course.plan.chapters.find((item) => item.id === chapterId);
	if (!chapter) {
		notFound();
	}

	const lessonIds = new Set(chapter.lessons.map((lesson) => lesson.id));
	const problemSetIds = new Set(
		chapter.lessons.flatMap((lesson) =>
			lesson.problemSets.map((problemSet) => problemSet.id),
		),
	);

	const chapterEvents = course.plan.calendar.filter((event) => {
		return lessonIds.has(event.refId) || problemSetIds.has(event.refId);
	});

	return (
		<main className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-6 py-12">
			<section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div>
					<h1 className="text-3xl font-semibold">{chapter.title}</h1>
					<p className="mt-2 text-sm text-muted-foreground">
						Part of{" "}
						<Link
							href={`/app/courses/${row.id}`}
							className="text-primary underline underline-offset-4 hover:text-primary/80"
						>
							{course.title}
						</Link>
					</p>
				</div>
				<Link
					href={`/app/courses/${row.id}`}
					className="text-sm text-primary underline underline-offset-4 hover:text-primary/80"
				>
					Back to course
				</Link>
			</section>

			<section className="rounded-lg border border-border bg-card p-6 shadow-sm">
				<header className="flex flex-col gap-2 border-b border-dashed border-border/50 pb-4 md:flex-row md:items-center md:justify-between">
					<div>
						<p className="text-sm font-medium text-muted-foreground">
							{course.syllabusExtract.term} -{" "}
							{course.syllabusExtract.instructor}
						</p>
						<h2 className="text-2xl font-semibold">
							{chapter.order}. {chapter.title}
						</h2>
						<p className="text-sm text-muted-foreground">
							{formatDate(chapter.startDate)} - {formatDate(chapter.dueDate)}
						</p>
					</div>
					<p className="rounded-md bg-muted px-3 py-1 text-xs uppercase tracking-wide text-muted-foreground/80">
						{chapter.lessons.length} lesson
						{chapter.lessons.length === 1 ? "" : "s"}
					</p>
				</header>

				<div className="mt-6 space-y-6">
					{chapter.lessons.map((lesson) => (
						<article
							key={lesson.id}
							className="rounded-md border border-border/60 bg-background p-4"
						>
							<header>
								<h3 className="text-lg font-semibold">{lesson.title}</h3>
								<ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
									{lesson.objectives.map((objective) => (
										<li key={objective}>{objective}</li>
									))}
								</ul>
							</header>

							{lesson.resources.length > 0 ? (
								<div className="mt-4">
									<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
										Resources
									</p>
									<ul className="mt-2 space-y-1">
										{renderResources(lesson.resources)}
									</ul>
								</div>
							) : null}

							{renderProblemSets(lesson.problemSets)}
						</article>
					))}
				</div>
			</section>

			<section className="rounded-lg border border-border bg-card p-6 shadow-sm">
				<h2 className="text-xl font-semibold">Upcoming Dates</h2>
				<p className="mt-2 text-sm text-muted-foreground">
					Milestones tied directly to this chapter&apos;s lessons and problem
					sets.
				</p>

				{chapterEvents.length === 0 ? (
					<p className="mt-4 text-sm text-muted-foreground">
						No scheduled items yet.
					</p>
				) : (
					<ul className="mt-4 space-y-3">
						{chapterEvents.map((event) => (
							<li
								key={`${event.date}-${event.refId}`}
								className="flex flex-col gap-1 rounded-md border border-border/70 bg-background px-4 py-3 text-sm md:flex-row md:items-center md:justify-between"
							>
								<div>
									<p className="font-medium">
										{formatDate(event.date)} - {capitalize(event.type)}
									</p>
									<p className="text-xs uppercase tracking-wide text-muted-foreground/80">
										Ref ID: {event.refId}
									</p>
								</div>
							</li>
						))}
					</ul>
				)}
			</section>
		</main>
	);
}

export const dynamic = "force-dynamic";
