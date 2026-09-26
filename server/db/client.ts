import postgres from "postgres";

const globalSql = globalThis as { launcherSql?: postgres.Sql };

export function databaseUrl() {
  return process.env.DATABASE_URL || "";
}

export function getSql() {
  const url = databaseUrl();
  if (!url) throw new Error("DATABASE_URL is not set");
  if (!globalSql.launcherSql) {
    globalSql.launcherSql = postgres(url, { max: 8, idle_timeout: 20 });
  }
  return globalSql.launcherSql;
}

export async function closeSql() {
  if (!globalSql.launcherSql) return;
  await globalSql.launcherSql.end({ timeout: 5 });
  globalSql.launcherSql = undefined;
}
