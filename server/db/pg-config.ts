import type { PoolConfig } from "pg";

function isLocalDatabase(connectionString: string): boolean {
  try {
    const host = new URL(connectionString).hostname;
    return host === "localhost" || host === "127.0.0.1";
  } catch {
    return false;
  }
}

function connectionStringForPg(connectionString: string): string {
  const url = new URL(connectionString);
  url.searchParams.delete("sslmode");
  url.searchParams.delete("uselibpqcompat");
  return url.toString();
}

export function pgPoolConfig(connectionString: string | undefined): PoolConfig {
  if (!connectionString) {
    throw new Error("DATABASE_URL não definida");
  }

  return {
    connectionString: connectionStringForPg(connectionString),
    max: process.env.VERCEL ? 1 : 10,
    connectionTimeoutMillis: 10_000,
    ...(isLocalDatabase(connectionString)
      ? {}
      : { ssl: { rejectUnauthorized: false } }),
  };
}
