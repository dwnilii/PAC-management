
// Type definitions for the application

export interface OU {
    id: number;
    name: string;
    description?: string;
    color: string;
    proxy: string;
    mode: 'proxyAll' | 'directExcept';
    domains: string[];
    bypassDomains: string[];
    created_at?: string;
    updated_at?: string;
}

export interface User {
    id: number;
    name: string;
    description?: string;
    color: string;
    ou?: string;
    proxy: string;
    mode: 'proxyAll' | 'directExcept';
    domains: string[];
    bypassDomains: string[];
    created_at?: string;
    updated_at?: string;
}

export interface Proxy {
    id: number;
    name: string;
    protocol: 'http' | 'https' | 'socks4' | 'socks5' | 'socks';
    ip: string;
    port: number;
    username?: string;
    password?: string;
}

export interface AppSettings {
    sessionTimeoutMinutes: number;
    pacDirectoryPath: string;
    defaultProxyMode: 'proxyAll' | 'directExcept';
}

export interface ErrorResponse {
    error: string;
}

export interface SuccessResponse<T = any> {
    message: string;
    data?: T;
}
