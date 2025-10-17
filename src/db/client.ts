import "server-only";

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

import * as schema from "./schema";

const connectionString = process.env.SUPABASE_DB_URL;

if (!connectionString) {
	throw new Error("Missing Supabase connection string");
}

const createSqlClient = () =>
	postgres(connectionString, {
		prepare: false,
	});

type SqlClient = ReturnType<typeof createSqlClient>;
type DrizzleDb = ReturnType<typeof drizzle<typeof schema>>;

declare global {
	var __supabaseSqlClient: SqlClient | undefined;
	var __supabaseDrizzle: DrizzleDb | undefined;
}

const sqlClient =
	global.__supabaseSqlClient ?? (global.__supabaseSqlClient = createSqlClient());

export const db =
	global.__supabaseDrizzle ??
	(global.__supabaseDrizzle = drizzle(sqlClient, { schema }));

export { sqlClient as supabaseSqlClient };
