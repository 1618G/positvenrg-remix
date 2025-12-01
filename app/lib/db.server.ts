import { PrismaClient } from "@prisma/client";
import { requireEnv } from "./env.server";

declare global {
  var __db__: PrismaClient;
}

let db: PrismaClient;

// Configure connection pooling via DATABASE_URL query parameters
// connection_limit: Maximum number of connections in the pool
// pool_timeout: Maximum time to wait for a connection (seconds)
function getDatabaseUrl(): string {
  const databaseUrl = requireEnv("DATABASE_URL");
  
  // Check if connection pooling parameters already exist
  if (databaseUrl.includes("connection_limit") || databaseUrl.includes("pool_timeout")) {
    return databaseUrl;
  }
  
  // Add connection pooling parameters
  const separator = databaseUrl.includes("?") ? "&" : "?";
  const connectionLimit = process.env.DATABASE_CONNECTION_LIMIT || "20";
  const poolTimeout = process.env.DATABASE_POOL_TIMEOUT || "20";
  
  return `${databaseUrl}${separator}connection_limit=${connectionLimit}&pool_timeout=${poolTimeout}`;
}

// This is needed because in development we don't want to restart
// the server with every change, but we want to make sure we don't
// create a new connection to the DB with every change either.
// In production we'll have a single connection to the DB with pooling.
if (process.env.NODE_ENV === "production") {
  db = new PrismaClient({
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },
    log: process.env.LOG_LEVEL === "debug" ? ["query", "error", "warn"] : ["error"],
  });
} else {
  if (!global.__db__) {
    global.__db__ = new PrismaClient({
      datasources: {
        db: {
          url: getDatabaseUrl(),
        },
      },
      log: process.env.LOG_LEVEL === "debug" ? ["query", "error", "warn"] : ["error"],
    });
  }
  db = global.__db__;
  db.$connect();
}

export { db };
