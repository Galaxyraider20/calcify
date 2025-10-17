
CREATE TABLE IF NOT EXISTS "course_files" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "original_name" text NOT NULL,
  "mime_type" text,
  "size_bytes" integer NOT NULL,
  "storage_path" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "course_files_user_id_idx"
  ON "course_files" ("user_id");
