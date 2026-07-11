// Light admin gate for the dispatcher board and master-data mutations.
// Not real auth — a shared passcode adequate for a private internal tool.

export function checkPasscode(passcode) {
  const expected = process.env.ADMIN_PASSCODE || "";
  return !!expected && passcode === expected;
}

// For mutating admin API routes: expects header "x-admin-passcode".
export function requireAdmin(request) {
  const provided = request.headers.get("x-admin-passcode") || "";
  return checkPasscode(provided);
}

export function unauthorized() {
  return Response.json({ error: "Admin passcode required." }, { status: 401 });
}
