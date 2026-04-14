import { getSchemaVersion, setSchemaVersion } from "./storage";

const CURRENT_SCHEMA_VERSION = 1;

export async function runMigrations(): Promise<void> {
  try {
    const version = await getSchemaVersion();
    if (version < 1) {
      // Migration 1: initial schema — nothing to migrate, just stamp version
      await setSchemaVersion(1);
    }
  } catch {
    // Migrations failing should not crash the app
  }
}
