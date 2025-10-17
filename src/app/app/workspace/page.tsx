import { revalidatePath } from "next/cache";

import { Button } from "@/components/ui/button";

import { getWorkspace, upsertWorkspace } from "./actions";

async function saveWorkspace(formData: FormData) {
	"use server";

	const title = formData.get("title")?.toString().trim() || "My Workspace";
	const notes = formData.get("notes")?.toString() ?? "";

	await upsertWorkspace({
		title,
		data: { notes },
	});

	revalidatePath("/app/workspace");
}

export default async function WorkspacePage() {
	const workspace = await getWorkspace();
	const title = workspace?.title ?? "My Workspace";
	const notes =
		typeof workspace?.data === "object" &&
		workspace?.data !== null &&
		"notes" in workspace.data
			? String(workspace.data.notes ?? "")
			: "";

	return (
		<main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-12">
			<section className="rounded-lg border border-border bg-card p-6 shadow-sm">
				<h1 className="text-2xl font-semibold">Workspace</h1>
				<p className="mt-2 text-sm text-muted-foreground">
					Update your primary workspace details. Content is saved in Supabase
					for future sessions.
				</p>
				<form action={saveWorkspace} className="mt-6 flex flex-col gap-4">
					<label className="flex flex-col gap-2">
						<span className="text-sm font-medium">Title</span>
						<input
							name="title"
							defaultValue={title}
							className="rounded-md border border-input bg-background px-3 py-2 text-base shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
							required
						/>
					</label>
					<label className="flex flex-col gap-2">
						<span className="text-sm font-medium">Notes</span>
						<textarea
							name="notes"
							defaultValue={notes}
							rows={8}
							className="rounded-md border border-input bg-background px-3 py-2 text-base shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
							placeholder="Capture important work-in-progress items, reminders, or links."
						/>
					</label>
					<Button type="submit" className="self-start">
						Save Workspace
					</Button>
				</form>
			</section>
		</main>
	);
}
