// TEMP diagnostic — reports which DB-related env var NAMES the runtime sees.
// No values are exposed. Remove after diagnosing the Netlify DB injection.
export const dynamic = "force-dynamic";

export async function GET() {
  const keys = Object.keys(process.env).filter((k) =>
    /DATABASE|NEON|POSTGRES|NETLIFY_DB|PGHOST|PGDATABASE/i.test(k)
  );
  return Response.json({
    dbEnvKeys: keys.sort(),
    hasDATABASE_URL: !!process.env.DATABASE_URL,
    hasNETLIFY_DATABASE_URL: !!process.env.NETLIFY_DATABASE_URL,
    hasNETLIFY_DATABASE_URL_UNPOOLED: !!process.env.NETLIFY_DATABASE_URL_UNPOOLED,
  });
}
