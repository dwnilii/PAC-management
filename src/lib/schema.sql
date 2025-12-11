-- PAC Management Database Schema V1.0

PRAGMA foreign_keys = ON;

-- Drop existing tables if they exist
DROP TABLE IF EXISTS ous;
DROP TABLE IF EXISTS proxies;
DROP TABLE IF EXISTS settings;

-- Proxy Servers Table
CREATE TABLE proxies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    protocol TEXT NOT NULL CHECK(protocol IN ('http', 'https', 'socks4', 'socks5')),
    ip TEXT NOT NULL CHECK(ip <> ''),
    port INTEGER NOT NULL CHECK(port > 0 AND port <= 65535),
    username TEXT,
    password TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create index for proxy lookups
CREATE INDEX idx_proxies_name ON proxies(name);

-- Organizational Units (OUs) Table
CREATE TABLE ous (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL CHECK(name <> ''),
    description TEXT,
    color TEXT NOT NULL DEFAULT '#000000',
    proxy TEXT NOT NULL,
    mode TEXT NOT NULL DEFAULT 'proxyAll' CHECK(mode IN ('proxyAll', 'directExcept')),
    domains TEXT DEFAULT '[]' CHECK(json_valid(domains)),
    bypassDomains TEXT DEFAULT '[]' CHECK(json_valid(bypassDomains)),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (proxy) REFERENCES proxies(name) ON DELETE RESTRICT
) STRICT;

-- Create indexes for OU lookups
CREATE INDEX idx_ous_name ON ous(name);
CREATE INDEX idx_ous_proxy ON ous(proxy);

-- Settings Table
CREATE TABLE settings (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
) STRICT;

-- Triggers for updated_at timestamps
CREATE TRIGGER proxies_updated_at 
AFTER UPDATE ON proxies
BEGIN
    UPDATE proxies SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER ous_updated_at 
AFTER UPDATE ON ous
BEGIN
    UPDATE ous SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER settings_updated_at 
AFTER UPDATE ON settings
BEGIN
    UPDATE settings SET updated_at = CURRENT_TIMESTAMP WHERE key = NEW.key;
END;

-- Insert default settings
INSERT INTO settings (key, value) VALUES 
('pacDirectoryPath', '/var/www/html/pac'),
('defaultProxyMode', 'proxyAll'),
('sessionTimeoutMinutes', '15');

-- Create a test proxy for development
INSERT INTO proxies (name, protocol, ip, port) VALUES 
('Default-HTTP-Proxy', 'http', '127.0.0.1', 8080);
