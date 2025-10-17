import type {
	CourseLesson,
	CourseProblemSet,
	CourseRecord,
} from "./course-data";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
	dateStyle: "medium",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
	dateStyle: "medium",
	timeStyle: "short",
});

export function formatDate(dateString: string) {
	return dateFormatter.format(new Date(dateString));
}

export function formatDateTime(dateString: string) {
	return dateTimeFormatter.format(new Date(dateString));
}

export function formatWeeks(weeks: number[]) {
	if (weeks.length === 0) {
		return "Weeks TBD";
	}

	const sorted = [...weeks].sort((a, b) => a - b);
	if (sorted.length === 1) {
		return `Week ${sorted[0]}`;
	}

	const isConsecutive = sorted.every((week, index) =>
		index === 0 ? true : week === sorted[index - 1] + 1
	);

	return isConsecutive
		? `Weeks ${sorted[0]}-${sorted[sorted.length - 1]}`
		: `Weeks ${sorted.join(", ")}`;
}

export function capitalize(input: string) {
	if (!input) return input;
	return input.charAt(0).toUpperCase() + input.slice(1);
}

export type ReferenceMaps = {
	lessons: Map<string, { title: string; chapterTitle: string }>;
	problemSets: Map<
		string,
		{ title: string; lessonTitle: string; chapterTitle: string }
	>;
};

export function buildReferenceMaps(course: CourseRecord): ReferenceMaps {
	const lessons = new Map<string, { title: string; chapterTitle: string }>();
	const problemSets = new Map<
		string,
		{ title: string; lessonTitle: string; chapterTitle: string }
	>();

	for (const chapter of course.plan.chapters) {
		for (const lesson of chapter.lessons) {
			lessons.set(lesson.id, {
				title: lesson.title,
				chapterTitle: chapter.title,
			});

			for (const problemSet of lesson.problemSets) {
				problemSets.set(problemSet.id, {
					title: problemSet.title,
					lessonTitle: lesson.title,
					chapterTitle: chapter.title,
				});
			}
		}
	}

	return { lessons, problemSets };
}

export function renderResources(resources: CourseLesson["resources"]) {
	return resources.map((resource) => (
		<li key={resource.label} className="text-sm text-muted-foreground">
			{resource.href ? (
				<a
					href={resource.href}
					className="text-primary underline underline-offset-2 hover:text-primary/80"
					target="_blank"
					rel="noreferrer"
				>
					{resource.label}
				</a>
			) : (
				resource.label
			)}{" "}
			<span className="text-xs uppercase tracking-wide text-muted-foreground/80">
				({resource.type})
			</span>
		</li>
	));
}

export function renderProblemSets(problemSets: CourseProblemSet[]) {
	if (problemSets.length === 0) {
		return null;
	}

	return (
		<div className="mt-4 rounded-md border border-border/60 bg-muted/30 p-4">
			<h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
				Problem Sets
			</h4>
			<ul className="mt-3 space-y-3">
				{problemSets.map((set) => (
					<li key={set.id} className="space-y-2">
						<p className="text-sm font-medium">{set.title}</p>
						<ul className="space-y-2 text-sm text-muted-foreground">
							{set.problems.map((problem) => (
								<li key={problem.id}>
									<p>{problem.prompt}</p>
									<div className="mt-1 flex flex-wrap gap-x-3 text-xs uppercase text-muted-foreground/80">
										<span>Difficulty: {capitalize(problem.difficulty)}</span>
										<span>Tags: {problem.tags.join(", ")}</span>
									</div>
								</li>
							))}
						</ul>
					</li>
				))}
			</ul>
		</div>
	);
}
