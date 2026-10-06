import { afterEach, describe, expect, it, vi } from "vitest";
afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); });
function configure() {
  vi.resetModules();
  vi.stubEnv("DATABASE_URL", "postgresql://localhost/bridgepay_test");
  vi.stubEnv("JWT_SECRET", "a".repeat(48));
  vi.stubEnv("CORS_ORIGIN", "http://localhost:8081");
}
describe("Signing and browser origin configuration", () => {
  it("rejects the example signing secret", async () => {
    configure();
    vi.stubEnv("JWT_SECRET", "replace-this-with-a-random-secret-at-least-32-characters-long");
    await expect(import("../src/config/env")).rejects.toThrow("placeholders are not allowed");
  });
  it("rejects wildcard origins", async () => {
    configure(); vi.stubEnv("CORS_ORIGIN", "*");
    await expect(import("../src/config/env")).rejects.toThrow("without paths or wildcards");
  });
  it("accepts explicit frontend origins", async () => {
    configure(); vi.stubEnv("CORS_ORIGIN", "http://localhost:8081,https://app.example.invalid");
    const { env } = await import("../src/config/env");
    expect(env.CORS_ORIGIN.split(",")).toHaveLength(2);
  });
});
