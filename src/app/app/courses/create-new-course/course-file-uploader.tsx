"use client";

import { useEffect, useState } from "react";
import { CloudUpload, Loader2, Trash2 } from "lucide-react";

type UploadedFile = {
	id: string;
	originalName: string;
	mimeType: string | null;
	sizeBytes: number;
	createdAt: string;
};

export default function CourseFileUploader() {
	const [files, setFiles] = useState<UploadedFile[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [uploading, setUploading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let isMounted = true;

		async function fetchFiles() {
			setIsLoading(true);
			try {
				const response = await fetch("/api/course-uploads", {
					method: "GET",
					headers: { "Content-Type": "application/json" },
					cache: "no-store",
				});
				if (!response.ok) {
					throw new Error("Failed to load files.");
				}
				const data = (await response.json()) as { files: UploadedFile[] };
				if (isMounted) {
					setFiles(data.files);
				}
			} catch (fetchError) {
				console.error(fetchError);
				if (isMounted) {
					setError("Could not load uploaded files. Try again later.");
				}
			} finally {
				if (isMounted) {
					setIsLoading(false);
				}
			}
		}

		fetchFiles();
		return () => {
			isMounted = false;
		};
	}, []);

	const refreshFiles = async () => {
		try {
			const response = await fetch("/api/course-uploads", {
				method: "GET",
				headers: { "Content-Type": "application/json" },
				cache: "no-store",
			});
			if (!response.ok) {
				throw new Error("Failed to refresh files.");
			}
			const data = (await response.json()) as { files: UploadedFile[] };
			setFiles(data.files);
		} catch (refreshError) {
			console.error(refreshError);
			setError("Could not refresh files. Please reload the page.");
		}
	};

	const uploadFiles = async (fileList: FileList | null) => {
		if (!fileList || fileList.length === 0) return;

		setUploading(true);
		setError(null);

		try {
			for (const file of Array.from(fileList)) {
				const formData = new FormData();
				formData.append("file", file);

				const response = await fetch("/api/course-uploads", {
					method: "POST",
					body: formData,
				});

				if (!response.ok) {
					const message = await response.text();
					throw new Error(
						message || `Failed to upload ${file.name}. Please try again.`,
					);
				}
			}

			await refreshFiles();
		} catch (uploadError) {
			console.error(uploadError);
			setError(
				uploadError instanceof Error
					? uploadError.message
					: "Something went wrong while uploading. Try again.",
			);
		} finally {
			setUploading(false);
		}
	};

	const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
		event.preventDefault();
		uploadFiles(event.dataTransfer.files).catch((dropError) => {
			console.error(dropError);
		});
	};

	const handleDelete = async (id: string) => {
		setError(null);
		try {
			const response = await fetch("/api/course-uploads", {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ id }),
			});
			if (!response.ok) {
				throw new Error("Failed to delete file.");
			}
			setFiles((prev) => prev.filter((file) => file.id !== id));
		} catch (deleteError) {
			console.error(deleteError);
			setError(
				deleteError instanceof Error
					? deleteError.message
					: "Could not delete the file. Please try again.",
			);
		}
	};

	return (
		<div className="flex flex-col gap-4">
			<div
				onDragOver={(event) => event.preventDefault()}
				onDrop={handleDrop}
				className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border/70 bg-muted/30 px-6 py-12 text-center transition hover:border-primary/60"
			>
				<CloudUpload
					className="h-10 w-10 text-muted-foreground"
					aria-hidden="true"
				/>
				<div className="space-y-1">
					<p className="text-sm font-medium text-foreground">
						Drag & drop syllabus files here
					</p>
					<p className="text-xs text-muted-foreground">
						PDF, DOCX, TXT and up to 10 MB each
					</p>
				</div>
				<label className="cursor-pointer rounded-md border border-border bg-background px-4 py-2 text-sm font-medium transition hover:border-primary/60 hover:text-primary">
					Browse files
					<input
						type="file"
						className="hidden"
						accept=".pdf,.doc,.docx,.txt,.rtf"
						multiple
						onChange={(event) => uploadFiles(event.target.files)}
					/>
				</label>
			</div>

			<div className="rounded-lg border border-border bg-card p-4">
				<div className="flex items-center justify-between">
					<h3 className="text-sm font-semibold text-foreground">
						Uploaded files
					</h3>
					{(isLoading || uploading) && (
						<div className="flex items-center gap-2 text-xs text-muted-foreground">
							<Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
							<span>{uploading ? "Uploading..." : "Loading..."}</span>
						</div>
					)}
				</div>

				{error ? (
					<p className="mt-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
						{error}
					</p>
				) : null}

				{files.length === 0 ? (
					<p className="mt-3 text-xs text-muted-foreground">
						No files uploaded yet. Attach your syllabus or course materials to
						help the assistant extract details.
					</p>
				) : (
					<ul className="mt-3 space-y-2 text-sm text-foreground">
						{files.map((file) => (
							<li
								key={file.id}
								className="flex items-center justify-between rounded-md border border-border/70 bg-background px-3 py-2"
							>
								<div>
									<p className="font-medium">{file.originalName}</p>
									<p className="text-xs text-muted-foreground">
										{file.mimeType ?? "unknown"} |{" "}
										{(file.sizeBytes / (1024 * 1024)).toFixed(2)} MB |{" "}
										{new Date(file.createdAt).toLocaleString()}
									</p>
								</div>
								<button
									type="button"
									className="rounded-md border border-border/70 bg-background p-2 text-muted-foreground transition hover:border-destructive/40 hover:text-destructive"
									onClick={() => handleDelete(file.id)}
								>
									<span className="sr-only">Remove file</span>
									<Trash2 className="h-4 w-4" aria-hidden="true" />
								</button>
							</li>
						))}
					</ul>
				)}
			</div>

			<p className="text-xs text-muted-foreground">
				Files are scoped to your account. We store them outside the public web
				root so other users can&apos;t access them.
			</p>
		</div>
	);
}
