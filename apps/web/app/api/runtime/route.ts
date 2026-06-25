export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    orchestratorUrl: process.env.NEXT_PUBLIC_ORCHESTRATOR_URL || "http://127.0.0.1:4317",
    token: process.env.VK_LOCAL_SECRET || "local-development-secret-change-before-sharing",
  }, { headers: { "Cache-Control": "no-store" } });
}
