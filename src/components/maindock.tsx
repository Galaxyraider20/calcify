"use client";

import {
	Home,
	BookOpen,
	NotebookPen,
	LineChart,
	UserRound,
} from "lucide-react";
import { useRouter } from "next/navigation";

import {
	Dock,
	DockIcon,
	DockItem,
	DockLabel,
} from "@/components/ui/shadcn-io/dock";

const data = [
	{
		title: "Home",
		icon: (
			<Home className="h-full w-full text-neutral-600 dark:text-neutral-300" />
		),
		href: "/app",
	},
	{
		title: "Courses",
		icon: (
			<BookOpen className="h-full w-full text-neutral-600 dark:text-neutral-300" />
		),
		href: "/app/courses",
	},
	{
		title: "Workspace",
		icon: (
			<NotebookPen className="h-full w-full text-neutral-600 dark:text-neutral-300" />
		),
		href: "/app/workspace",
	},
	{
		title: "Graphing",
		icon: (
			<LineChart className="h-full w-full text-neutral-600 dark:text-neutral-300" />
		),
		href: "/app/graphing",
	},
	{
		title: "Profile",
		icon: (
			<UserRound className="h-full w-full text-neutral-600 dark:text-neutral-300" />
		),
		href: "/app/profile",
	},
];

export default function MainDock() {
	const router = useRouter();

	const navigateTo = (href: string) => {
		router.push(href);
	};

	return (
		<div className="fixed bottom-6 left-1/2 -translate-x-1/2 max-w-full">
			<Dock className="items-end pb-3">
				{data.map((item, idx) => (
					<DockItem
						key={idx}
						className="aspect-square rounded-full bg-gray-200 dark:bg-neutral-800"
						onClick={() => navigateTo(item.href)}
						onKeyDown={(event) => {
							if (event.key === "Enter" || event.key === " ") {
								event.preventDefault();
								navigateTo(item.href);
							}
						}}
						role="link"
						aria-label={item.title}
					>
						<DockLabel>{item.title}</DockLabel>
						<DockIcon>{item.icon}</DockIcon>
					</DockItem>
				))}
			</Dock>
		</div>
	);
}
