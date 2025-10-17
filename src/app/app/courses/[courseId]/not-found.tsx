import Link from "next/link";

export default function CourseNotFound() {
	return (
		<main className="mx-auto flex w-full max-w-xl flex-col gap-4 px-6 py-24 text-center">
			<h1 className="text-2xl font-semibold">Course not found</h1>
			<p className="text-sm text-muted-foreground">
				We couldn&apos;t find the course you were looking for. It may have been
				removed or renamed.
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
