"use client";
import {
	Navbar,
	NavBody,
	NavItems,
	MobileNav,
	NavbarLogo,
	NavbarButton,
	MobileNavHeader,
	MobileNavToggle,
	MobileNavMenu,
} from "@/components/ui/resizable-navbar";
import {
	SignInButton,
	SignUpButton,
	SignedIn,
	SignedOut,
	UserButton,
} from "@clerk/nextjs";
import { useState } from "react";
import ModeToggle from "./ui/dark-toggle";

export function NavbarDemo() {
	const navItems = [
		{
			name: "Features",
			link: "#features",
		},
		{
			name: "Pricing",
			link: "#pricing",
		},
		{
			name: "Contact",
			link: "#contact",
		},
	];

	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

	return (
		<div className="relative w-full">
			<Navbar>
				{/* Desktop Navigation */}
				<NavBody className="max-w-[94rem] px-6">
					<NavbarLogo />
					<NavItems items={navItems} />
					<div className="relative z-20 ml-auto flex items-center gap-3 pr-1">
						<SignedOut>
							<SignInButton />
							<SignUpButton>
								<button className="bg-[#6c47ff] text-white rounded-full font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 cursor-pointer">
									Sign Up
								</button>
							</SignUpButton>
						</SignedOut>

						<SignedIn>
							<UserButton />
						</SignedIn>

						<ModeToggle />
					</div>
				</NavBody>

				{/* Mobile Navigation */}
				<MobileNav>
					<MobileNavHeader>
						<NavbarLogo />
						<MobileNavToggle
							isOpen={isMobileMenuOpen}
							onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
						/>
					</MobileNavHeader>

					<MobileNavMenu isOpen={isMobileMenuOpen}>
						{navItems.map((item, idx) => (
							<a
								key={`mobile-link-${idx}`}
								href={item.link}
								onClick={() => setIsMobileMenuOpen(false)}
								className="relative text-neutral-600 dark:text-neutral-300"
							>
								<span className="block">{item.name}</span>
							</a>
						))}
						<div className="flex w-full flex-col gap-4">
							<NavbarButton
								onClick={() => setIsMobileMenuOpen(false)}
								variant="primary"
								className="w-full"
							>
								Login
							</NavbarButton>
							<NavbarButton
								onClick={() => setIsMobileMenuOpen(false)}
								variant="primary"
								className="w-full"
							>
								Book a call
							</NavbarButton>
						</div>
					</MobileNavMenu>
				</MobileNav>
			</Navbar>

			{/* Navbar */}
		</div>
	);
}
