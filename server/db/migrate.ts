import { schemaSql } from "./schema";
import { getSql } from "./client";

const MIGRATION_ID = "001_init";

export async function migrate() {
  const sql = getSql();
  await sql.unsafe(schemaSql);
  await sql`
    insert into schema_migrations (id)
    values (${MIGRATION_ID})
    on conflict (id) do nothing
  `;
}
