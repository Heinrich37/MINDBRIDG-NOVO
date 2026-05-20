import { createMemoryStore } from "./memory.js";
import { createPostgresStore } from "./postgres.js";

export async function createStore() {
  if (process.env.DATABASE_URL) {
    return createPostgresStore();
  }
  return createMemoryStore();
}
