
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs/promises';

// Define database connection type
type Database = Awaited<ReturnType<typeof open>>;

// Database singleton instance
let db: Database | null = null;

// Default settings
const defaultSettings = {
    sessionTimeoutMinutes: 15,
    pacDirectoryPath: '/var/www/html/pac',
    defaultProxyMode: 'proxyAll',
};

async function initializeDefaultSettings(dbInstance: Awaited<ReturnType<typeof open>>) {
    const settingsKey = 'pacManagementSettings';
    const existingSettings = await dbInstance.get('SELECT key FROM settings WHERE key = ?', settingsKey);

    if (!existingSettings) {
        console.log(`No default settings found. Seeding database with key '${settingsKey}'...`);
        await dbInstance.run(
            'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
            settingsKey,
            JSON.stringify(defaultSettings)
        );
        console.log('Default settings seeded successfully.');
    }
}


export async function getDb() {
  if (db) {
    return db;
  }

  try {
    const dbPath = path.join(process.cwd(), 'database.sqlite3');
    
    const newDb = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    // Check for a table that should exist, e.g., 'ous'
    const mainTable = await newDb.get("SELECT name FROM sqlite_master WHERE type='table' AND name='ous';");

    if (!mainTable) {
      console.log('Database tables not found, initializing schema...');
      // Since schema.sql is deleted, we create tables directly here.
      await newDb.exec(`
        CREATE TABLE IF NOT EXISTS ous (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            description TEXT,
            color TEXT,
            proxy TEXT NOT NULL,
            mode TEXT DEFAULT 'proxyAll',
            domains TEXT DEFAULT '[]',
            bypassDomains TEXT DEFAULT '[]',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (proxy) REFERENCES proxies(name) ON DELETE RESTRICT
        );

        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            description TEXT,
            color TEXT,
            ou TEXT,
            proxy TEXT NOT NULL,
            mode TEXT DEFAULT 'proxyAll',
            domains TEXT DEFAULT '[]',
            bypassDomains TEXT DEFAULT '[]',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (proxy) REFERENCES proxies(name) ON DELETE RESTRICT,
            FOREIGN KEY (ou) REFERENCES ous(name) ON DELETE SET NULL
        );

        CREATE TABLE IF NOT EXISTS proxies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            protocol TEXT NOT NULL,
            ip TEXT NOT NULL,
            port INTEGER NOT NULL,
            username TEXT,
            password TEXT
        );
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT
        );
      `);
      console.log('Database schema initialized successfully.');
      
      // After creating tables, seed the default settings
      await initializeDefaultSettings(newDb);

    } else {
        console.log('Connected to existing database.');

        // Migration check for settings table
        const settingsTable = await newDb.get("SELECT name FROM sqlite_master WHERE type='table' AND name='settings';");
        if (!settingsTable) {
            console.log("Migrating database: creating 'settings' table...");
            await newDb.exec('CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT);');
            console.log("'settings' table created successfully.");
        }

        // Also ensure default settings are present or updated
        await initializeDefaultSettings(newDb);
        
        // Add columns if they don't exist (for migration)
        const userTableInfo = await newDb.all("PRAGMA table_info(users);");
        if (!userTableInfo.some(col => col.name === 'ou')) {
            console.log("Migrating users table: adding 'ou' column...");
            await newDb.exec('ALTER TABLE users ADD COLUMN ou TEXT REFERENCES ous(name) ON DELETE SET NULL;');
            console.log("Users table migrated successfully.");
        }
    }
    
    db = newDb;
    return db;
  } catch (error) {
    console.error('Failed to connect to or initialize the database:', error);
    throw error;
  }
}
