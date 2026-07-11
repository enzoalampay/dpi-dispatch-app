import { checkPasscode } from "../../../../lib/admin";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const { passcode } = await request.json();
    return Response.json({ ok: checkPasscode(passcode) });
  } catch (e) {
    return Response.json({ ok: false, error: String(e.message || e) }, { status: 400 });
  }
}
