import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  checkRateLimit,
  getRateLimitStatus,
  getRequestIdentifier,
  rateLimits,
} from "~/lib/rate-limit.server";

// Mock cache functions
vi.mock("~/lib/cache.server", () => ({
  incrementCounter: vi.fn(),
  getCounter: vi.fn(),
  cacheKeys: {
    rateLimit: (identifier: string, window: string) => `ratelimit:${identifier}:${window}`,
  },
}));

vi.mock("~/lib/logger.server", () => ({
  default: {
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

import { incrementCounter, getCounter } from "~/lib/cache.server";

describe("Rate Limiting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("checkRateLimit", () => {
    it("should allow request within limit", async () => {
      vi.mocked(incrementCounter).mockResolvedValue(5);

      const result = await checkRateLimit({
        limit: 10,
        window: 60,
        identifier: "user-123",
      });

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(5);
    });

    it("should deny request exceeding limit", async () => {
      vi.mocked(incrementCounter).mockResolvedValue(11);

      const result = await checkRateLimit({
        limit: 10,
        window: 60,
        identifier: "user-123",
      });

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it("should return correct reset time", async () => {
      const now = new Date("2024-01-01T10:00:00Z");
      vi.setSystemTime(now);
      vi.mocked(incrementCounter).mockResolvedValue(1);

      const result = await checkRateLimit({
        limit: 10,
        window: 60,
        identifier: "user-123",
      });

      // Reset time should be at the start of next window
      expect(result.resetAt.getTime()).toBeGreaterThan(now.getTime());
    });
  });

  describe("getRateLimitStatus", () => {
    it("should return current rate limit status", async () => {
      vi.mocked(getCounter).mockResolvedValue(3);

      const result = await getRateLimitStatus({
        limit: 10,
        window: 60,
        identifier: "user-123",
      });

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(7);
    });
  });

  describe("getRequestIdentifier", () => {
    it("should use userId if provided", () => {
      const request = new Request("http://example.com");
      const identifier = getRequestIdentifier(request, "user-123");

      expect(identifier).toBe("user:user-123");
    });

    it("should use IP address from x-forwarded-for header", () => {
      const headers = new Headers({
        "x-forwarded-for": "192.168.1.1, 10.0.0.1",
      });
      const request = new Request("http://example.com", { headers });
      const identifier = getRequestIdentifier(request);

      expect(identifier).toBe("ip:192.168.1.1");
    });

    it("should use IP address from x-real-ip header", () => {
      const headers = new Headers({
        "x-real-ip": "192.168.1.1",
      });
      const request = new Request("http://example.com", { headers });
      const identifier = getRequestIdentifier(request);

      expect(identifier).toBe("ip:192.168.1.1");
    });

    it("should fallback to unknown if no IP available", () => {
      const request = new Request("http://example.com");
      const identifier = getRequestIdentifier(request);

      expect(identifier).toBe("ip:unknown");
    });
  });

  describe("rateLimits", () => {
    it("should have correct API rate limits", () => {
      expect(rateLimits.api.limit).toBe(100);
      expect(rateLimits.api.window).toBe(60);
    });

    it("should have correct chat rate limits", () => {
      expect(rateLimits.chat.limit).toBe(10);
      expect(rateLimits.chat.window).toBe(60);
    });

    it("should have correct login rate limits", () => {
      expect(rateLimits.login.limit).toBe(5);
      expect(rateLimits.login.window).toBe(900);
    });
  });
});

