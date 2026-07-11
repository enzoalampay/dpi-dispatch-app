import path from "node:path";
import { fileURLToPath } from "node:url";

// fileURLToPath decodes URL-encoded chars (the workspace path contains a space);
// new URL().pathname would leave it as %20 and break output tracing.
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // This app lives inside a larger workspace with other lockfiles — pin the
  // tracing root to this folder so Netlify bundles the right files.
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
