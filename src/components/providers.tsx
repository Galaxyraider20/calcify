"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/theme-provider";
import { useTheme } from "next-themes";
import { dark, light } from "@clerk/themes";

function ThemedClerkProvider({ children }: { children: React.ReactNode }) {
	const { resolvedTheme } = useTheme();

	return (
		<ClerkProvider
			appearance={{
				baseTheme: resolvedTheme === "dark" ? dark : light,
			}}
			/* publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY} */
		>
			{children}
		</ClerkProvider>
	);
}

export function Providers({ children }: { children: React.ReactNode }) {
	return (
		<ThemeProvider
			attribute="class"
			defaultTheme="system"
			enableSystem
			disableTransitionOnChange
		>
			<ThemedClerkProvider>{children}</ThemedClerkProvider>
		</ThemeProvider>
	);
}

export default Providers;
