import { migrate } from "./db/migrate";
import { closeSql } from "./db/client";

async function main() {
  await migrate();
  await closeSql();
  console.log("schema ready");
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
