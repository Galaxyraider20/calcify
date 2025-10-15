import Link from "next/link";
import {
	ArrowRight,
	Bot,
	Calculator,
	Cloud,
	LineChart,
	Sparkles,
} from "lucide-react";

const features = [
	{
		title: "Symbolic Brainpower",
		description:
			"Crack algebra, calculus, and discrete math with a solver that shows every transformation along the way.",
		icon: Calculator,
	},
	{
		title: "Cinematic Graphing",
		description:
			"Plot multi-variable functions, parametric curves, and implicit surfaces with smooth, real-time controls.",
		icon: LineChart,
	},
	{
		title: "AI Study Copilot",
		description:
			"Ask natural-language questions and get tailored walkthroughs powered by Calcify's Math AI stack.",
		icon: Bot,
	},
	{
		title: "Cloud-Synced Workspaces",
		description:
			"Save worksheets, graph layouts, and solution snapshots so you can pick up right where you left off on any device.",
		icon: Cloud,
	},
];

const pricing = [
	{
		name: "Starter",
		price: "Free",
		description: "Perfect for learners exploring powerful computation.",
		features: [
			"Unlimited quick calculations",
			"Interactive graphing canvas",
			"Step-by-step explanations (5/day)",
			"Save 3 workspaces",
		],
		cta: "Create free account",
		href: "/sign-up",
		popular: false,
	},
	{
		name: "Scholar",
		price: "$9",
		frequency: "per month",
		description: "Go deeper with unlimited solving and personalized study sets.",
		features: [
			"Full symbolic solver access",
			"Animated multi-function graphing",
			"AI study guides and quizzes",
			"Version history for worksheets",
		],
		cta: "Upgrade to Scholar",
		href: "/sign-up",
		popular: true,
	},
	{
		name: "Labs",
		price: "$19",
		frequency: "per month",
		description: "Built for educators and teams who need collaboration at scale.",
		features: [
			"Shared folders and permissions",
			"Live classroom dashboards",
			"Dataset ingestion for custom problems",
			"Priority support and onboarding",
		],
		cta: "Contact sales",
		href: "#contact",
		popular: false,
	},
];

export default function LandingPage() {
	return (
		<div className="space-y-24 text-slate-900 dark:text-slate-100">
			<section
				id="home"
				className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-400 via-purple-500 to-slate-900 p-8 text-white shadow-[0_30px_80px_-40px_rgba(76,29,149,0.8)] sm:p-12 lg:p-16 dark:from-indigo-600/90 dark:via-purple-700/90 dark:to-slate-950"
			>
				<div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.18),_transparent_45%)]" />
				<div className="relative z-10 grid gap-12 lg:grid-cols-[minmax(0,1fr),380px] lg:items-center">
					<div className="space-y-6 text-balance">
						<span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-1 text-sm font-medium uppercase tracking-widest text-purple-100">
							<Sparkles className="h-4 w-4" />
							Smart Math Workspace
						</span>
						<h1 className="text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
							Master every calculation, from intuition to visualization.
						</h1>
						<p className="max-w-xl text-lg text-purple-100/90">
							Calcify unifies symbolic math, cinematic graphing, and study-ready
							AIs so you can move from equations to insights without switching
							tabs.
						</p>
						<div className="flex flex-wrap gap-3">
							<Link
								href="/app"
								className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:-translate-y-0.5 hover:shadow-lg"
							>
								Launch Calcify
								<ArrowRight className="h-4 w-4" />
							</Link>
							<Link
								href="#features"
								className="inline-flex items-center gap-2 rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/10"
							>
								Explore features
							</Link>
						</div>
					</div>
					<div className="relative hidden h-full w-full rounded-2xl border border-white/20 bg-slate-900/70 p-6 shadow-2xl ring-1 ring-white/10 lg:block">
						<div className="flex items-center justify-between text-xs text-slate-300">
							<p>calcify.session</p>
							<p>real-time</p>
						</div>
						<div className="mt-6 space-y-4 text-sm text-slate-200">
							<div className="rounded-xl border border-white/10 bg-slate-800/80 p-4 shadow-lg">
								<p className="font-semibold text-indigo-200">
									Solve: integral (2x^3 - 5x) dx
								</p>
								<ul className="mt-3 space-y-2 text-indigo-100/90">
									<li>Integrate each term separately.</li>
									<li>Result: 0.5x^4 - 2.5x^2 + C.</li>
								</ul>
							</div>
							<div className="rounded-xl border border-white/10 bg-slate-800/80 p-4 shadow-lg">
								<p className="font-semibold text-emerald-200">
									Graph preview: y = sin(x) + 0.5cos(2x)
								</p>
								<div className="mt-3 rounded-lg border border-emerald-400/20 bg-slate-900/70 p-4">
									<svg
										viewBox="0 0 320 160"
										fill="none"
										className="h-36 w-full text-emerald-300"
									>
										<defs>
											<linearGradient id="grid" x1="0" x2="0" y1="0" y2="1">
												<stop offset="0%" stopColor="rgba(34,197,94,0.15)" />
												<stop offset="100%" stopColor="rgba(34,197,94,0.05)" />
											</linearGradient>
										</defs>
										<rect width="320" height="160" fill="rgba(15,23,42,0.85)" />
										<g stroke="url(#grid)" strokeWidth="0.5">
											{Array.from({ length: 7 }).map((_, index) => (
												<line
													/* horizontal grid */
													key={`h-${index}`}
													x1="0"
													x2="320"
													y1={20 + index * 20}
													y2={20 + index * 20}
												/>
											))}
											{Array.from({ length: 9 }).map((_, index) => (
												<line
													/* vertical grid */
													key={`v-${index}`}
													y1="0"
													y2="160"
													x1={20 + index * 30}
													x2={20 + index * 30}
												/>
											))}
										</g>
										<polyline
											points="0,80 20,90 40,110 60,125 80,122 100,105 120,85 140,70 160,65 180,70 200,83 220,105 240,122 260,128 280,118 300,95 320,75"
											stroke="rgb(34,197,94)"
											strokeWidth="2.5"
											fill="none"
											strokeLinecap="round"
										/>
										<polyline
											points="0,82 20,70 40,60 60,62 80,75 100,92 120,108 140,116 160,112 180,97 200,80 220,66 240,62 260,70 280,88 300,108 320,118"
											stroke="rgba(59,130,246,0.7)"
											strokeWidth="2"
											fill="none"
											strokeLinecap="round"
										/>
										{[60, 140, 220, 300].map((x, idx) => (
											<circle
												key={idx}
												cx={x}
												cy={idx % 2 === 0 ? 70 : 105}
												r="3.5"
												fill="rgb(134,239,172)"
											/>
										))}
									</svg>
								</div>
								<p className="mt-2 text-xs text-emerald-100/80">
									Dynamic range controls and zero crossings enabled.
								</p>
							</div>
						</div>
					</div>
				</div>
			</section>

			<section
				id="features"
				className="space-y-10 rounded-3xl border border-slate-200/70 bg-white/70 p-8 shadow-[0_20px_60px_-45px_rgba(15,23,42,0.35)] dark:border-slate-800/60 dark:bg-slate-950/40 sm:p-12"
			>
				<div className="space-y-3">
					<h2 className="text-3xl font-semibold text-slate-900 dark:text-white sm:text-4xl">
						Why Calcify
					</h2>
					<p className="max-w-2xl text-slate-600 dark:text-slate-300">
						Every tool is crafted for ambitious students, researchers, and
						educators who demand precision without sacrificing creativity.
					</p>
				</div>
				<div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
					{features.map(({ title, description, icon: Icon }) => (
						<div
							key={title}
							className="group relative flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl dark:border-slate-800/80 dark:bg-slate-900/60 dark:shadow-[0_15px_45px_-30px_rgba(15,23,42,1)]"
						>
							<div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-200/20 via-transparent to-purple-200/20 opacity-0 transition group-hover:opacity-100 dark:from-indigo-500/15 dark:to-purple-500/20" />
							<div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-200">
								<Icon className="h-6 w-6" />
							</div>
							<div className="relative z-10 space-y-2">
								<h3 className="text-lg font-semibold text-slate-900 dark:text-white">
									{title}
								</h3>
								<p className="text-sm text-slate-600 dark:text-slate-300">
									{description}
								</p>
							</div>
						</div>
					))}
				</div>
			</section>

			<section className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white p-10 shadow-[0_18px_60px_-50px_rgba(15,23,42,0.35)] sm:p-12 dark:border-slate-800/70 dark:bg-slate-900/70">
				<div className="grid gap-10 lg:grid-cols-2 lg:items-center">
					<div className="space-y-6">
						<h2 className="text-3xl font-semibold sm:text-4xl">
							A workspace that learns your style.
						</h2>
						<p className="text-slate-600 dark:text-slate-300">
							Calcify remembers the kinds of problems you tackle and surfaces
							custom hints, graph presets, and citation-ready explanations. It is
							like working with a mentor who documents every insight.
						</p>
						<ul className="space-y-3 text-slate-700 dark:text-slate-200">
							<li className="flex items-start gap-3">
								<span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500/15 text-sm font-semibold text-indigo-700 dark:bg-indigo-500/30 dark:text-indigo-100">
									1
								</span>
								Start with a blank canvas or import existing problem sets to
								augment.
							</li>
							<li className="flex items-start gap-3">
								<span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500/15 text-sm font-semibold text-indigo-700 dark:bg-indigo-500/30 dark:text-indigo-100">
									2
								</span>
								Use structured notebooks, graph panels, and AI prompts side by
								side.
							</li>
							<li className="flex items-start gap-3">
								<span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500/15 text-sm font-semibold text-indigo-700 dark:bg-indigo-500/30 dark:text-indigo-100">
									3
								</span>
								Export polished solutions or share interactive sessions with
								classmates instantly.
							</li>
						</ul>
					</div>
					<div className="relative rounded-3xl border border-indigo-100/60 bg-gradient-to-br from-indigo-100 via-purple-100 to-white p-8 shadow-inner dark:border-indigo-500/30 dark:from-indigo-500/20 dark:via-purple-500/20 dark:to-slate-900/80">
						<div className="space-y-4 text-sm text-indigo-900 dark:text-indigo-100">
							<div className="rounded-2xl border border-white/60 bg-white/80 p-5 shadow-lg backdrop-blur dark:border-white/10 dark:bg-slate-950/70">
								<p className="text-xs uppercase tracking-[0.3em] text-indigo-300/80">
									Session summary
								</p>
								<p className="mt-3 text-lg font-semibold">
									You solved 14 problems in 32 minutes with 97% accuracy.
								</p>
								<p className="mt-2 text-xs text-indigo-100/80">
									Recommended next: Fourier series practice set.
								</p>
							</div>
							<div className="rounded-2xl border border-white/60 bg-white/70 p-5 shadow-lg backdrop-blur dark:border-white/10 dark:bg-slate-950/60">
								<p className="text-xs uppercase tracking-[0.3em] text-emerald-300/80">
									Live collaboration
								</p>
								<div className="mt-3 grid grid-cols-2 gap-3 text-slate-700 dark:text-slate-200">
									<div className="rounded-lg border border-emerald-300/40 bg-emerald-200/20 p-3 dark:border-emerald-500/30 dark:bg-emerald-500/10">
										<p className="text-xs uppercase text-emerald-700 dark:text-emerald-200">
											Editing
										</p>
										<p className="mt-1 text-sm font-semibold">
											Ellipse optimization
										</p>
									</div>
									<div className="rounded-lg border border-emerald-300/40 bg-emerald-200/20 p-3 dark:border-emerald-500/30 dark:bg-emerald-500/10">
										<p className="text-xs uppercase text-emerald-700 dark:text-emerald-200">
											Watching
										</p>
										<p className="mt-1 text-sm font-semibold">
											Topology seminar notes
										</p>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			<section
				id="pricing"
				className="space-y-12 rounded-3xl border border-slate-200/70 bg-white/80 p-8 shadow-[0_20px_60px_-45px_rgba(15,23,42,0.35)] dark:border-slate-800/70 dark:bg-slate-950/50 sm:p-12"
			>
				<div className="space-y-3 text-center">
					<h2 className="text-3xl font-semibold text-slate-900 dark:text-white sm:text-4xl">
						Pricing tuned for every stage
					</h2>
					<p className="mx-auto max-w-2xl text-slate-600 dark:text-slate-300">
						Start building momentum for free, then scale to advanced features and
						team collaboration when you need it.
					</p>
				</div>
				<div className="grid gap-6 lg:grid-cols-3">
					{pricing.map((plan) => (
						<div
							key={plan.name}
							className={`relative flex h-full flex-col justify-between rounded-3xl border bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-2xl dark:bg-slate-900/70 ${
								plan.popular
									? "border-indigo-300/80 ring-2 ring-indigo-200/80 dark:border-indigo-400/60 dark:ring-indigo-400/40"
									: "border-slate-200/80 dark:border-slate-800/80"
							}`}
						>
							<div className="space-y-4">
								{plan.popular && (
									<span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-500 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-md">
										Most loved
									</span>
								)}
								<h3 className="text-xl font-semibold text-slate-900 dark:text-white">
									{plan.name}
								</h3>
								<div className="text-3xl font-semibold text-indigo-600 dark:text-indigo-200">
									{plan.price}
									{plan.frequency && (
										<span className="ml-2 text-base text-slate-500 dark:text-slate-300">
											{plan.frequency}
										</span>
									)}
								</div>
								<p className="text-sm text-slate-600 dark:text-slate-300">
									{plan.description}
								</p>
								<ul className="space-y-3 text-sm text-slate-600 dark:text-slate-200">
									{plan.features.map((feature) => (
										<li key={feature} className="flex items-start gap-3">
											<span className="mt-1 inline-flex h-2 w-2 rounded-full bg-indigo-500/80 dark:bg-indigo-400" />
											{feature}
										</li>
									))}
								</ul>
							</div>
							<Link
								href={plan.href}
								className={`mt-8 inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold transition ${
									plan.popular
										? "bg-indigo-500 text-white shadow-md hover:bg-indigo-400"
										: "border border-slate-300 text-indigo-600 hover:border-indigo-400 hover:text-indigo-500 dark:border-slate-700 dark:text-white dark:hover:border-indigo-400"
								}`}
							>
								{plan.cta}
							</Link>
						</div>
					))}
				</div>
			</section>

			<section
				id="contact"
				className="relative overflow-hidden rounded-3xl border border-slate-200/70 bg-gradient-to-br from-indigo-100 via-white to-purple-100 p-10 shadow-[0_25px_60px_-40px_rgba(15,23,42,0.35)] sm:p-14 dark:border-slate-800/80 dark:from-slate-900 dark:via-slate-950 dark:to-indigo-950"
			>
				<div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(79,70,229,0.25),_transparent_55%)]" />
				<div className="relative z-10 grid gap-10 lg:grid-cols-2 lg:items-center">
					<div className="space-y-5">
						<h2 className="text-3xl font-semibold text-slate-900 dark:text-white sm:text-4xl">
							Bring Calcify to your classroom or research lab.
						</h2>
						<p className="text-slate-600 dark:text-slate-300">
							Tell us about your team's goals and we will craft a rollout that
							complements your curriculum, timetable, and compliance needs.
						</p>
						<ul className="space-y-3 text-slate-700 dark:text-slate-200">
							<li className="flex items-center gap-3">
								<span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-indigo-200/60 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200">
									1
								</span>
								Onboard with live workshops and resource kits.
							</li>
							<li className="flex items-center gap-3">
								<span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-indigo-200/60 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200">
									2
								</span>
								Integrate LMS exports and single sign-on effortlessly.
							</li>
							<li className="flex items-center gap-3">
								<span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-indigo-200/60 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200">
									3
								</span>
								Get priority support from the Calcify math education team.
							</li>
						</ul>
					</div>
					<div className="space-y-6 rounded-3xl border border-white/70 bg-white/80 p-6 backdrop-blur dark:border-white/10 dark:bg-white/5">
						<p className="text-sm text-slate-700 dark:text-slate-100/80">
							Email us at{" "}
							<Link
								href="mailto:hello@calcify.ai"
								className="font-semibold text-indigo-600 underline-offset-4 hover:underline dark:text-indigo-200"
							>
								hello@calcify.ai
							</Link>{" "}
							or schedule a call so we can tailor a plan for you.
						</p>
						<Link
							href="mailto:hello@calcify.ai?subject=Calcify%20for%20our%20team"
							className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-indigo-500"
						>
							Schedule a consult
							<ArrowRight className="h-4 w-4" />
						</Link>
						<p className="text-xs text-slate-600 dark:text-slate-200/70">
							Fun fact: Calcify crunches symbolic algebra at 17 times the speed
							of traditional CAS engines thanks to our hybrid GPU pipeline.
						</p>
					</div>
				</div>
			</section>
		</div>
	);
}
