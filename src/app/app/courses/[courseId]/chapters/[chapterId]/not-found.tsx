import Link from "next/link";

export default function ChapterNotFound() {
	return (
		<main className="mx-auto flex w-full max-w-xl flex-col gap-4 px-6 py-24 text-center">
			<h1 className="text-2xl font-semibold">Chapter not found</h1>
			<p className="text-sm text-muted-foreground">
				The requested chapter doesn&apos;t exist anymore or isn&apos;t part of this
				course.
			</p>
			<Link
				href="/app/courses"
				className="text-sm text-primary underline underline-offset-4 hover:text-primary/80"
			>
				Back to courses
			</Link>
		</main>
	);
}
