import { Pool } from "pg";

declare global {
  var _pgPool: Pool | undefined;
}

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL environment variable is not defined.");
  }
  return url;
}

function getPool(): Pool {
  if (!globalThis._pgPool) {
    globalThis._pgPool = new Pool({
      connectionString: getDatabaseUrl(),
      ssl: {
        rejectUnauthorized: false,
      },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
  }
  return globalThis._pgPool;
}

/**
 * Tagged template literal SQL query executor using node-postgres (`pg.Pool`).
 * Directly communicates with PostgreSQL over pooled TCP connection.
 * Returns an array of row objects matching selected columns.
 *
 * Example:
 *   const users = await sql`SELECT * FROM "User" WHERE email = ${email}`;
 */
export async function sql<T = any>(
  strings: TemplateStringsArray | string,
  ...values: any[]
): Promise<T[]> {
  const pool = getPool();

  if (typeof strings === "string") {
    const result = await pool.query(strings, values);
    return (result.rows || []) as T[];
  }

  let text = strings[0];
  const params: any[] = [];
  for (let i = 0; i < values.length; i++) {
    params.push(values[i]);
    text += `$${i + 1}` + strings[i + 1];
  }

  const result = await pool.query(text, params);
  return (result.rows || []) as T[];
}

export { getPool };
