import { revalidatePath } from "next/cache";

import { Button } from "@/components/ui/button";

import { getPreferences, upsertPreferences } from "./actions";

async function savePreferences(formData: FormData) {
	"use server";

	const theme = formData.get("theme")?.toString() || "system";
	const calcMode = formData.get("calcMode")?.toString() || "symbolic";
	const notificationsEnabled = formData.get("notificationsEnabled") === "on";

	await upsertPreferences({
		theme,
		calcMode,
		notificationsEnabled,
	});

	revalidatePath("/app/profile");
}

export default async function ProfilePage() {
	const prefs = await getPreferences();

	return (
		<main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-12">
			<section className="rounded-lg border border-border bg-card p-6 shadow-sm">
				<h1 className="text-2xl font-semibold">Preferences</h1>
				<p className="mt-2 text-sm text-muted-foreground">
					Tune your experience across the app. Changes sync through Supabase so
					they follow you on every device.
				</p>
				<form action={savePreferences} className="mt-6 flex flex-col gap-4">
					<label className="flex flex-col gap-2">
						<span className="text-sm font-medium">Theme</span>
						<select
							name="theme"
							defaultValue={prefs?.theme ?? "system"}
							className="rounded-md border border-input bg-background px-3 py-2 text-base shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
						>
							<option value="system">System</option>
							<option value="light">Light</option>
							<option value="dark">Dark</option>
						</select>
					</label>

					<label className="flex flex-col gap-2">
						<span className="text-sm font-medium">Calculator Mode</span>
						<select
							name="calcMode"
							defaultValue={prefs?.calcMode ?? "symbolic"}
							className="rounded-md border border-input bg-background px-3 py-2 text-base shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
						>
							<option value="symbolic">Symbolic</option>
							<option value="numeric">Numeric</option>
							<option value="graphing">Graphing</option>
						</select>
					</label>

					<label className="flex items-center gap-3">
						<input
							type="checkbox"
							name="notificationsEnabled"
							defaultChecked={prefs?.notificationsEnabled ?? true}
							className="h-4 w-4 rounded border border-input text-primary focus:ring-primary"
						/>
						<span className="text-sm">
							Enable reminders and helpful notifications.
						</span>
					</label>

					<Button type="submit" className="self-start">
						Save Preferences
					</Button>
				</form>
			</section>
		</main>
	);
}
