/**
 * Database Service
 *
 * Main entry point for SQLite database operations
 */

import * as SQLite from 'expo-sqlite';
import { SCHEMA_STATEMENTS, DROP_ALL_TABLES, SCHEMA_VERSION } from './schema';

const DATABASE_NAME = 'shop_management.db';

let db: SQLite.SQLiteDatabase | null = null;
let writeQueue: Promise<any> = Promise.resolve();
let initializationPromise: Promise<void> | null = null;

/**
 * Get database instance (singleton)
 */
export function getDatabase(): SQLite.SQLiteDatabase {
  if (!db) {
    db = SQLite.openDatabaseSync(DATABASE_NAME);
  }
  return db;
}

/**
 * Initialize database and create tables
 */
export async function initializeDatabase(): Promise<void> {
  if (initializationPromise) return initializationPromise;

  initializationPromise = (async () => {
    const database = getDatabase();

    // Add to write queue to ensure sequential execution
    const operation = writeQueue.then(async () => {
      console.log('[DB] Initializing database...');
      try {
        // Optimization: Enable WAL mode and set busy timeout
        await database.execAsync('PRAGMA journal_mode = WAL;');
        await database.execAsync('PRAGMA busy_timeout = 5000;');
        await database.execAsync('PRAGMA foreign_keys = ON;');

        // Create all tables and indexes
        for (const statement of SCHEMA_STATEMENTS) {
          await database.execAsync(statement);
        }

        // Set the schema version to the current version so migrations are skipped on fresh install
        const now = new Date().toISOString();
        await database.runAsync(
          `INSERT OR IGNORE INTO app_settings (key, value, updated_at) VALUES (?, ?, ?)`,
          ['schema_version', SCHEMA_VERSION.toString(), now]
        );

        console.log('[DB] Database initialized successfully');
      } catch (error) {
        console.error('[DB] Failed to initialize database:', error);
        initializationPromise = null; // Allow retry on failure
        throw error;
      }
    });

    writeQueue = operation.catch(() => {});
    return operation;
  })();

  return initializationPromise;
}

/**
 * Execute a query and return results
 */
export async function executeQuery<T = any>(
  sql: string,
  params: any[] = []
): Promise<T[]> {
  const database = getDatabase();

  try {
    const result = await database.getAllAsync<T>(sql, params);
    return result;
  } catch (error) {
    console.error('[DB] Query failed:', sql, params, error);
    throw error;
  }
}

/**
 * Execute a query and return first result
 */
export async function executeQuerySingle<T = any>(
  sql: string,
  params: any[] = []
): Promise<T | null> {
  const database = getDatabase();

  try {
    const result = await database.getFirstAsync<T>(sql, params);
    return result || null;
  } catch (error) {
    console.error('[DB] Query failed:', sql, params, error);
    throw error;
  }
}

/**
 * Execute a statement (INSERT, UPDATE, DELETE)
 * Wrapped in a queue to prevent "database is locked" errors
 */
export async function executeStatement(
  sql: string,
  params: any[] = []
): Promise<SQLite.SQLiteRunResult> {
  const database = getDatabase();

  // Add to write queue
  const operation = writeQueue.then(async () => {
    try {
      return await database.runAsync(sql, params);
    } catch (error) {
      console.error('[DB] Statement failed:', sql, params, error);
      throw error;
    }
  });

  writeQueue = operation.catch(() => {}); // Prevent queue from breaking on error
  return operation;
}

/**
 * Execute multiple statements in a transaction
 */
export async function executeTransaction(
  statements: { sql: string; params?: any[] }[]
): Promise<void> {
  const database = getDatabase();

  // Add to write queue
  const operation = writeQueue.then(async () => {
    try {
      await database.withTransactionAsync(async () => {
        for (const { sql, params = [] } of statements) {
          await database.runAsync(sql, params);
        }
      });
    } catch (error) {
      console.error('[DB] Transaction failed:', error);
      throw error;
    }
  });

  writeQueue = operation.catch(() => {});
  return operation;
}

/**
 * Execute a custom transaction function
 */
export async function withTransaction<T>(
  callback: () => Promise<T>
): Promise<T> {
  const database = getDatabase();

  // Add to write queue
  const operation = writeQueue.then(async () => {
    try {
      let result: T;
      await database.withTransactionAsync(async () => {
        result = await callback();
      });
      return result!;
    } catch (error) {
      console.error('[DB] Transaction failed:', error);
      throw error;
    }
  });

  writeQueue = operation.catch(() => {});
  return operation;
}

/**
 * Close database connection
 */
export function closeDatabase(): void {
  if (db) {
    db.closeSync();
    db = null;
    initializationPromise = null;
    writeQueue = Promise.resolve();
    console.log('[DB] Database closed');
  }
}

/**
 * Reset database state (useful for testing or after errors)
 */
export function resetDatabaseState(): void {
  initializationPromise = null;
  writeQueue = Promise.resolve();
  console.log('[DB] Database state reset');
}

/**
 * Drop all tables (for development/testing only)
 */
export async function dropAllTables(): Promise<void> {
  const database = getDatabase();

  console.warn('[DB] Dropping all tables...');

  // Add to write queue to prevent "database is locked" errors
  const operation = writeQueue.then(async () => {
    try {
      await database.execAsync('PRAGMA foreign_keys = OFF;');

      // Use the drop statements from schema
      for (const statement of DROP_ALL_TABLES) {
        await database.execAsync(statement);
      }

      await database.execAsync('PRAGMA foreign_keys = ON;');

      console.warn('[DB] All tables dropped');
    } catch (error) {
      console.error('[DB] Failed to drop tables:', error);
      throw error;
    }
  });

  writeQueue = operation.catch(() => {});
  return operation;
}
