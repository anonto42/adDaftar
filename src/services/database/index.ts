/**
 * Database Service
 *
 * Main entry point for SQLite database operations
 */

import * as SQLite from 'expo-sqlite';
import { SCHEMA_STATEMENTS } from './schema';

const DATABASE_NAME = 'shop_management.db';

let db: SQLite.SQLiteDatabase | null = null;

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
  console.log('[DB] Initializing database...');

  const database = getDatabase();

  try {
    // Enable foreign keys
    await database.execAsync('PRAGMA foreign_keys = ON;');

    // Create all tables and indexes
    for (const statement of SCHEMA_STATEMENTS) {
      await database.execAsync(statement);
    }

    console.log('[DB] Database initialized successfully');
  } catch (error) {
    console.error('[DB] Failed to initialize database:', error);
    throw error;
  }
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
 */
export async function executeStatement(
  sql: string,
  params: any[] = []
): Promise<SQLite.SQLiteRunResult> {
  const database = getDatabase();

  try {
    const result = await database.runAsync(sql, params);
    return result;
  } catch (error) {
    console.error('[DB] Statement failed:', sql, params, error);
    throw error;
  }
}

/**
 * Execute multiple statements in a transaction
 */
export async function executeTransaction(
  statements: Array<{ sql: string; params?: any[] }>
): Promise<void> {
  const database = getDatabase();

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
}

/**
 * Execute a custom transaction function
 */
export async function withTransaction<T>(
  callback: () => Promise<T>
): Promise<T> {
  const database = getDatabase();

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
}

/**
 * Close database connection
 */
export function closeDatabase(): void {
  if (db) {
    db.closeSync();
    db = null;
    console.log('[DB] Database closed');
  }
}

/**
 * Drop all tables (for development/testing only)
 */
export async function dropAllTables(): Promise<void> {
  const database = getDatabase();

  console.warn('[DB] Dropping all tables...');

  try {
    await database.execAsync('PRAGMA foreign_keys = OFF;');

    const dropStatements = [
      'DROP TABLE IF EXISTS sale_items;',
      'DROP TABLE IF EXISTS sales;',
      'DROP TABLE IF EXISTS customers;',
      'DROP TABLE IF EXISTS products;',
      'DROP TABLE IF EXISTS app_settings;',
    ];

    for (const statement of dropStatements) {
      await database.execAsync(statement);
    }

    await database.execAsync('PRAGMA foreign_keys = ON;');

    console.warn('[DB] All tables dropped');
  } catch (error) {
    console.error('[DB] Failed to drop tables:', error);
    throw error;
  }
}
