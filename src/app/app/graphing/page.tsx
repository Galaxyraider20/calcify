import { revalidatePath } from "next/cache";

import { Button } from "@/components/ui/button";

import { clearGraphHistory, listGraphHistory, logGraphEntry } from "./actions";

function parseJsonRecord(raw: string | null): Record<string, unknown> {
	if (!raw) {
		return {};
	}

	try {
		const parsed = JSON.parse(raw);
		if (parsed && typeof parsed === "object") {
			return parsed as Record<string, unknown>;
		}
	} catch (error) {
		console.warn("Failed to parse JSON payload for graph entry:", error);
	}

	return {};
}

async function recordGraph(formData: FormData) {
	"use server";

	const expression = formData.get("expression")?.toString().trim();
	if (!expression) {
		return;
	}

	const rawVariables = parseJsonRecord(
		formData.get("variables")?.toString() ?? null,
	);
	const variables: Record<string, number> = {};
	for (const [key, value] of Object.entries(rawVariables)) {
		const numericValue = Number(value);
		if (!Number.isNaN(numericValue)) {
			variables[key] = numericValue;
		}
	}

	const settings = parseJsonRecord(
		formData.get("settings")?.toString() ?? null,
	);

	await logGraphEntry({
		expression,
		variables,
		settings,
	});

	revalidatePath("/app/graphing");
}

async function clearHistory() {
	"use server";

	await clearGraphHistory();
	revalidatePath("/app/graphing");
}

export default async function GraphingPage() {
	const history = await listGraphHistory(25);

	return (
		<main className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-6 py-12">
			<section className="rounded-lg border border-border bg-card p-6 shadow-sm">
				<h1 className="text-2xl font-semibold">Graphing History</h1>
				<p className="mt-2 text-sm text-muted-foreground">
					Log graph expressions you explore. Each entry is saved so you can pick
					up where you left off.
				</p>
				<form action={recordGraph} className="mt-6 flex flex-col gap-4">
					<label className="flex flex-col gap-2">
						<span className="text-sm font-medium">Expression</span>
						<input
							name="expression"
							required
							className="rounded-md border border-input bg-background px-3 py-2 text-base shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
							placeholder="e.g. sin(x) + cos(y)"
						/>
					</label>
					<label className="flex flex-col gap-2">
						<span className="text-sm font-medium">Variables JSON</span>
						<textarea
							name="variables"
							rows={3}
							className="rounded-md border border-input bg-background px-3 py-2 text-base shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
							placeholder='{"x": 1, "y": 0}'
						/>
					</label>
					<label className="flex flex-col gap-2">
						<span className="text-sm font-medium">Settings JSON</span>
						<textarea
							name="settings"
							rows={3}
							className="rounded-md border border-input bg-background px-3 py-2 text-base shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
							placeholder='{"theme": "dark"}'
						/>
					</label>
					<Button type="submit" className="self-start">
						Log Graph
					</Button>
				</form>
			</section>

			<section className="rounded-lg border border-border bg-card p-6 shadow-sm">
				<div className="flex items-center justify-between gap-4">
					<h2 className="text-xl font-semibold">Recent Entries</h2>
					<form action={clearHistory}>
						<Button type="submit" variant="outline">
							Clear History
						</Button>
					</form>
				</div>
				{history.length === 0 ? (
					<p className="mt-4 text-sm text-muted-foreground">
						No graph entries yet. Log your first expression above.
					</p>
				) : (
					<ul className="mt-6 grid gap-3">
						{history.map((entry) => (
							<li
								key={entry.id}
								className="rounded-md border border-border/80 bg-background px-4 py-3"
							>
								<div className="flex items-center justify-between gap-4">
									<p className="font-medium text-foreground">
										{entry.expression}
									</p>
									<span className="text-xs text-muted-foreground">
										{entry.renderedAt
											? new Date(entry.renderedAt).toLocaleString()
											: ""}
									</span>
								</div>
								{entry.variables && Object.keys(entry.variables).length > 0 ? (
									<p className="mt-2 text-xs text-muted-foreground">
										Variables:{" "}
										<code>{JSON.stringify(entry.variables, null, 2)}</code>
									</p>
								) : null}
								{entry.settings && Object.keys(entry.settings).length > 0 ? (
									<p className="mt-2 text-xs text-muted-foreground">
										Settings:{" "}
										<code>{JSON.stringify(entry.settings, null, 2)}</code>
									</p>
								) : null}
							</li>
						))}
					</ul>
				)}
			</section>
		</main>
	);
}
