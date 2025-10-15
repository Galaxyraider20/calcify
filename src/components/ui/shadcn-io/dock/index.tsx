"use client";

import {
	motion,
	MotionValue,
	useMotionValue,
	useSpring,
	useTransform,
	type SpringOptions,
	type HTMLMotionProps,
	AnimatePresence,
} from "framer-motion";
import {
	Children,
	cloneElement,
	createContext,
	isValidElement,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { cn } from "@/lib/utils";

const DOCK_HEIGHT = 128;
const DEFAULT_MAGNIFICATION = 80;
const DEFAULT_DISTANCE = 150;
const DEFAULT_PANEL_HEIGHT = 64;

type DockProps = {
	children: React.ReactNode;
	className?: string;
	distance?: number;
	panelHeight?: number;
	magnification?: number;
	spring?: SpringOptions;
};
type DockItemProps = Omit<HTMLMotionProps<"div">, "children"> & {
	children: React.ReactNode;
};
type DockChildInjection = {
	width?: MotionValue<number>;
	isHovered?: MotionValue<number>;
};
type DockLabelProps = Omit<HTMLMotionProps<"div">, "children"> &
	DockChildInjection & {
		children: React.ReactNode;
		className?: string;
	};
type DockIconProps = Omit<HTMLMotionProps<"div">, "children"> &
	DockChildInjection & {
		children: React.ReactNode;
		className?: string;
	};

type DocContextType = {
	mouseX: MotionValue;
	spring: SpringOptions;
	magnification: number;
	distance: number;
};
type DockProviderProps = {
	children: React.ReactNode;
	value: DocContextType;
};

const DockContext = createContext<DocContextType | undefined>(undefined);

function DockProvider({ children, value }: DockProviderProps) {
	return <DockContext.Provider value={value}>{children}</DockContext.Provider>;
}

function useDock() {
	const context = useContext(DockContext);
	if (!context) {
		throw new Error("useDock must be used within an DockProvider");
	}
	return context;
}

function Dock({
	children,
	className,
	spring = { mass: 0.1, stiffness: 150, damping: 12 },
	magnification = DEFAULT_MAGNIFICATION,
	distance = DEFAULT_DISTANCE,
	panelHeight = DEFAULT_PANEL_HEIGHT,
}: DockProps) {
	const mouseX = useMotionValue(Infinity);
	const isHovered = useMotionValue(0);

	const maxHeight = useMemo(() => {
		return Math.max(DOCK_HEIGHT, magnification + magnification / 2 + 4);
	}, [magnification]);

	const heightRow = useTransform(isHovered, [0, 1], [panelHeight, maxHeight]);
	const height = useSpring(heightRow, spring);

	return (
		<motion.div
			style={{
				height: height,
				scrollbarWidth: "none",
			}}
			className="mx-2 flex max-w-full items-end overflow-x-auto"
		>
			<motion.div
				onMouseMove={({ pageX }) => {
					isHovered.set(1);
					mouseX.set(pageX);
				}}
				onMouseLeave={() => {
					isHovered.set(0);
					mouseX.set(Infinity);
				}}
				className={cn(
					"mx-auto flex w-fit gap-4 rounded-2xl bg-gray-50 px-4 dark:bg-neutral-900",
					className
				)}
				style={{ height: panelHeight }}
				role="toolbar"
				aria-label="Application dock"
			>
				<DockProvider value={{ mouseX, spring, distance, magnification }}>
					{children}
				</DockProvider>
			</motion.div>
		</motion.div>
	);
}

function DockItem({
	children,
	className,
	tabIndex = 0,
	role = "button",
	...rest
}: DockItemProps) {
	const ref = useRef<HTMLDivElement>(null);

	const { distance, magnification, mouseX, spring } = useDock();

	const isHovered = useMotionValue(0);

	const mouseDistance = useTransform(mouseX, (val) => {
		const domRect = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
		return val - domRect.x - domRect.width / 2;
	});

	const widthTransform = useTransform(
		mouseDistance,
		[-distance, 0, distance],
		[40, magnification, 40]
	);

	const width = useSpring(widthTransform, spring);

	return (
		<motion.div
			ref={ref}
			style={{ width }}
			onHoverStart={() => isHovered.set(1)}
			onHoverEnd={() => isHovered.set(0)}
			onFocus={() => isHovered.set(1)}
			onBlur={() => isHovered.set(0)}
			className={cn(
				"relative inline-flex items-center justify-center",
				className
			)}
			tabIndex={tabIndex}
			role={role}
			{...rest}
		>
			{Children.map(children, (child) => {
				if (!isValidElement<DockChildInjection>(child)) {
					return child;
				}

				return cloneElement(child, { width, isHovered });
			})}
		</motion.div>
	);
}

function DockLabel({
	children,
	className,
	isHovered,
	width: _width,
	...rest
}: DockLabelProps) {
	void _width;
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		if (!isHovered) {
			setIsVisible(false);
			return undefined;
		}

		const unsubscribe = isHovered.on("change", (latest) => {
			setIsVisible(latest === 1);
		});

		return () => unsubscribe();
	}, [isHovered]);

	if (!isHovered) {
		return null;
	}

	return (
		<AnimatePresence>
			{isVisible && (
				<motion.div
					initial={{ opacity: 0, y: 0 }}
					animate={{ opacity: 1, y: -10 }}
					exit={{ opacity: 0, y: 0 }}
					transition={{ duration: 0.2 }}
					className={cn(
						"absolute -top-6 left-1/2 w-fit whitespace-pre rounded-md border border-gray-200 bg-gray-100 px-2 py-0.5 text-xs text-neutral-700 dark:border-neutral-900 dark:bg-neutral-800 dark:text-white",
						className
					)}
					role="tooltip"
					style={{ x: "-50%" }}
					{...rest}
				>
					{children}
				</motion.div>
			)}
		</AnimatePresence>
	);
}

function DockIcon({
	children,
	className,
	width,
	isHovered: _isHovered,
	...rest
}: DockIconProps) {
	void _isHovered;
	const fallbackWidth = useMotionValue(0);
	const widthMotion = width ?? fallbackWidth;
	const widthTransform = useTransform(widthMotion, (val) => val / 2);

	return (
		<motion.div
			style={{ width: widthTransform }}
			className={cn("flex items-center justify-center", className)}
			{...rest}
		>
			{children}
		</motion.div>
	);
}

export { Dock, DockIcon, DockItem, DockLabel };
