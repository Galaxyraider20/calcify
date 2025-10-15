// src/app/landing/layout.tsx
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { NavbarDemo } from "@/components/mainnavbar";

export const metadata: Metadata = {
	title: "Calcify | Landing",
	description: "Your marketing copy here",
};

export default function LandingLayout({ children }: { children: ReactNode }) {
	return (
		<div className="min-h-screen bg-background text-foreground">
			<NavbarDemo />
			<main className="mx-auto w-full max-w-[94rem] px-10 py-12">{children}</main>
		</div>
	);
}
