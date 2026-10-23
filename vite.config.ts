import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import { handleSuggest } from "./api/suggest";

// Serves /api/suggest during `npm run dev` so you don't need the Vercel CLI locally.
// In production, Vercel runs api/suggest.ts instead.
function devApi(env: Record<string, string>): Plugin {
  return {
    name: "syds-kitchen-dev-api",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use("/api/suggest", async (req, res) => {
        const chunks: Buffer[] = [];
        for await (const chunk of req) chunks.push(chunk as Buffer);
        const request = new Request("http://localhost/api/suggest", {
          method: req.method,
          headers: req.headers as Record<string, string>,
          body: req.method === "POST" ? Buffer.concat(chunks) : undefined,
        });
        const response = await handleSuggest(request, { ...process.env, ...env }, { skipAuth: !env.VITE_SUPABASE_URL });
        res.statusCode = response.status;
        res.setHeader("Content-Type", "application/json");
        res.end(await response.text());
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react(), tailwindcss(), devApi(env)],
    resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  };
});
