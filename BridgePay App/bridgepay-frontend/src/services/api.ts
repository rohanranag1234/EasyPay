import type { Currency, Draft, Recipient, User } from "../domain/data";
import type { Quote, Transfer } from "./demo";

export type SavedRecipient = Recipient & {
  id: string;
  to: Currency;
  bank: string;
};
type RecipientDto = Recipient & {
  id: string;
  currency: Currency;
  bankName: string;
};
type UserDto = User & {
  id: string;
  name: string | null;
  mobile: string | null;
};
type AuthResponse = { token: string; user: UserDto };
type Page<T> = { nextCursor: string | null } & T;

// Expo inlines this public value. Never place a provider credential here.
const configuredUrl = process.env.EXPO_PUBLIC_API_URL?.trim() || "";
export const apiConfigured = configuredUrl.length > 0;

export class ApiService {
  private token: string | null = null;
  private generation = 0;
  constructor(private readonly baseUrl: string) {}

  reset() {
    this.generation++;
    this.token = null;
  }

  private async request<T>(
    path: string,
    body?: unknown,
    authenticated = true,
  ): Promise<T> {
    if (!this.baseUrl)
      throw new Error("Set EXPO_PUBLIC_API_URL to connect to the API.");
    const url = new URL(this.baseUrl);
    const development = typeof __DEV__ !== "undefined" && __DEV__;
    if (
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      !["http:", "https:"].includes(url.protocol)
    ) {
      throw new Error("The API URL is invalid.");
    }
    if (
      !development &&
      url.protocol !== "https:" &&
      !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
    ) {
      throw new Error(
        "An HTTPS API URL is required outside local development.",
      );
    }
    if (authenticated && !this.token) throw new Error("Please log in again.");
    const generation = this.generation;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(
        `${this.baseUrl.replace(/\/$/, "")}${path}`,
        {
          method: body === undefined ? "GET" : "POST",
          headers: {
            Accept: "application/json",
            ...(body === undefined
              ? {}
              : { "Content-Type": "application/json" }),
            ...(authenticated ? { Authorization: `Bearer ${this.token}` } : {}),
          },
          credentials: "omit",
          ...(body === undefined ? {} : { body: JSON.stringify(body) }),
          signal: controller.signal,
        },
      );
      if (generation !== this.generation)
        throw new Error("Your session changed. Please try again.");
      const result = await response.json();
      if (generation !== this.generation)
        throw new Error("Your session changed. Please try again.");
      if (!response.ok) {
        if (response.status === 401 && authenticated)
          throw new Error("Your session expired. Log out and log in again.");
        throw new Error(
          result.details?.[0]?.message ||
            result.error ||
            "The request failed. Please try again.",
        );
      }
      return result as T;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(
          "The request timed out. Retry to check its result; a transfer may already have been saved.",
        );
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  async authenticate(
    mode: "login" | "register",
    details: {
      email: string;
      password: string;
      name?: string;
      mobile?: string;
    },
  ): Promise<User> {
    this.reset();
    const generation = this.generation;
    const result = await this.request<AuthResponse>(
      `/api/auth/${mode}`,
      details,
      false,
    );
    if (generation !== this.generation)
      throw new Error("Your session changed. Please try again.");
    this.token = result.token;
    return {
      ...result.user,
      name: result.user.name || "",
      mobile: result.user.mobile || "",
      guest: false,
    };
  }

  async createQuote(draft: Draft) {
    const { quote } = await this.request<{ quote: Quote }>(
      "/api/transfers/quote",
      draft,
    );
    return {
      ...quote,
      recipient: { ...quote.recipient, save: draft.recipient.save },
    };
  }

  async confirm(quote: Quote) {
    // Stable for this immutable server quote, including after a timeout or reload.
    const { transfer } = await this.request<{ transfer: Transfer }>(
      "/api/transfers/confirm",
      {
        quoteId: quote.id,
        idempotencyKey: `bridgepay:${quote.id}`,
        saveRecipient: quote.recipient.save,
      },
    );
    return transfer;
  }

  listTransfers(cursor?: string) {
    return this.request<Page<{ transfers: Transfer[] }>>(
      `/api/transfers?limit=50${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`,
    );
  }

  async listRecipients() {
    const result = await this.request<Page<{ recipients: RecipientDto[] }>>(
      "/api/recipients?limit=100",
    );
    return result.recipients.map((r) => ({
      ...r,
      to: r.currency,
      bank: r.bankName,
    }));
  }
}

export const api = new ApiService(configuredUrl);
