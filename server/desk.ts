import { publish } from "./bus";
import { getSql } from "./db/client";
import { scrub } from "../src/lib/scrub";

function asJson(value: unknown) {
  return JSON.parse(JSON.stringify(value)) as never;
}

type DeskSettings = { deskName?: string; ethUsd?: number; eurUsd?: number };
type DeskProject = {
  id?: string;
  name?: string;
  ticker?: string;
  chain?: string;
  contract?: string;
  supply?: string;
  status?: string;
  launch?: string;
  launchpadId?: string;
  targetDate?: string;
  client?: string;
  budgetUsd?: number;
  sample?: boolean;
};

export type DeskSnapshot = {
  settings?: DeskSettings;
  projects?: DeskProject[];
  contacts?: { id?: string }[];
  services?: { id?: string }[];
  packages?: { id?: string }[];
  providers?: { id?: string }[];
  platforms?: { id?: string }[];
};

function text(value: unknown) {
  return typeof value === "string" ? value : "";
}

async function replaceRecords(kind: string, rows: { id?: string }[] | undefined) {
  const sql = getSql();
  const items = (rows || []).filter((row) => row.id);
  if (items.length === 0) {
    await sql`delete from records where kind = ${kind}`;
    return;
  }
  const ids = items.map((row) => String(row.id));
  await sql`delete from records where kind = ${kind} and id <> all(${ids})`;
  for (const row of items) {
    const id = String(row.id);
    await sql`
      insert into records (kind, id, body, updated_at)
      values (${kind}, ${id}, ${sql.json(asJson(scrub(row)))}, now())
      on conflict (kind, id) do update
      set body = excluded.body, updated_at = now()
    `;
  }
}

export async function syncDesk(input: DeskSnapshot) {
  const sql = getSql();
  const settings = input.settings || {};
  await sql`
    insert into desks (id, name, eth_usd, eur_usd, updated_at)
    values ('desk', ${text(settings.deskName) || "Launcher"}, ${Number(settings.ethUsd) || 0}, ${Number(settings.eurUsd) || 0}, now())
    on conflict (id) do update
    set name = excluded.name,
        eth_usd = excluded.eth_usd,
        eur_usd = excluded.eur_usd,
        updated_at = now()
  `;

  const projects = (input.projects || []).filter((project) => project.id);
  const ids = projects.map((project) => String(project.id));
  if (ids.length === 0) await sql`delete from tokens`;
  else await sql`delete from tokens where id <> all(${ids})`;

  for (const project of projects) {
    const id = String(project.id);
    const body = scrub(project);
    await sql`
      insert into tokens (
        id, name, ticker, chain, contract, supply, status, launch, launchpad_id, target_date, client, budget_usd, sample, body, updated_at
      ) values (
        ${id},
        ${text(project.name) || "Token"},
        ${text(project.ticker)},
        ${text(project.chain)},
        ${text(project.contract)},
        ${text(project.supply)},
        ${text(project.status) || "draft"},
        ${text(project.launch)},
        ${text(project.launchpadId)},
        ${text(project.targetDate)},
        ${text(project.client)},
        ${Number(project.budgetUsd) || 0},
        ${Boolean(project.sample)},
        ${sql.json(asJson(body))},
        now()
      )
      on conflict (id) do update set
        name = excluded.name,
        ticker = excluded.ticker,
        chain = excluded.chain,
        contract = excluded.contract,
        supply = excluded.supply,
        status = excluded.status,
        launch = excluded.launch,
        launchpad_id = excluded.launchpad_id,
        target_date = excluded.target_date,
        client = excluded.client,
        budget_usd = excluded.budget_usd,
        sample = excluded.sample,
        body = excluded.body,
        updated_at = now()
    `;
    await publish({ type: "token.synced", tokenId: id, at: new Date().toISOString() });
  }

  await replaceRecords("contact", input.contacts);
  await replaceRecords("service", input.services);
  await replaceRecords("package", input.packages);
  await replaceRecords("provider", input.providers);
  await replaceRecords("platform", input.platforms);
  await publish({ type: "desk.synced", tokens: projects.length, at: new Date().toISOString() });
  return { tokens: projects.length };
}
