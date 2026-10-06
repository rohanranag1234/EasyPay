import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32).refine(v => !/replace-this|change.?me|example|password/i.test(v), "Generate a random JWT secret; placeholders are not allowed"),
  CORS_ORIGIN: z.string().default("http://localhost:8081,http://localhost:19006").refine(value =>
    value.split(",").every(origin => {
      try { const url = new URL(origin.trim()); return ["http:", "https:"].includes(url.protocol) && url.origin === origin.trim(); }
      catch { return false; }
    }), "Use comma-separated explicit HTTP(S) origins, without paths or wildcards")
});
export const env = envSchema.parse(process.env);
