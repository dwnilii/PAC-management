
'use server';

import fs from 'fs/promises';
import path from 'path';
import { getDb } from '@/lib/db';
import type { AppSettings } from '@/types/app';

const PAC_BASE_PATH = '/var/www/html/pac';

type EntityType = 'ou' | 'user';

function getEntityConfig(entityType: EntityType) {
    if (entityType === 'ou') {
        return {
            tableName: 'ous',
            basePath: PAC_BASE_PATH,
            errorName: 'OU',
        };
    } else { // entityType === 'user'
        return {
            tableName: 'users',
            basePath: path.join(PAC_BASE_PATH, 'users'),
            errorName: 'User',
        };
    }
}


/**
 * Generates the JavaScript content for a PAC file based on entity rules.
 * @param entityName The name of the entity (OU or User).
 * @param entityType The type of the entity ('ou' or 'user').
 * @returns The PAC file content as a string.
 */
async function generatePacContent(entityName: string, entityType: EntityType): Promise<string> {
    const db = await getDb();
    const config = getEntityConfig(entityType);
    
    // 1. Fetch Entity details
    const entity = await db.get(`SELECT * FROM ${config.tableName} WHERE name = ?`, entityName);
    if (!entity) throw new Error(`${config.errorName} "${entityName}" not found.`);


    // 2. Fetch Proxy details
    if (!entity.proxy) throw new Error(`No proxy server is assigned to the ${config.errorName.toLowerCase()} "${entityName}". Please assign a proxy.`);
    const proxy = await db.get('SELECT * FROM proxies WHERE name = ?', entity.proxy);
    if (!proxy) throw new Error(`The proxy server "${entity.proxy}" assigned to ${config.errorName.toLowerCase()} "${entityName}" was not found.`);

    // 3. Prepare proxy string for PAC file based on protocol
    let pacProxyType;
    const protocol = proxy.protocol.toLowerCase();

    switch (protocol) {
        case 'http':
        case 'https':
            pacProxyType = 'PROXY';
            break;
        case 'socks4':
        case 'socks': // SOCKS version 4
            pacProxyType = 'SOCKS';
            break;
        case 'socks5':
            pacProxyType = 'SOCKS5';
            break;
        default:
            throw new Error(`Unsupported proxy protocol: ${proxy.protocol}`);
    }
    const proxyString = `${pacProxyType} ${proxy.ip}:${proxy.port}`;
    
    const domainsToProxy: string[] = entity.domains ? JSON.parse(entity.domains) : [];
    const domainsToBypass: string[] = entity.bypassDomains ? JSON.parse(entity.bypassDomains) : [];

    const functionHeader = `function FindProxyForURL(url, host) {\n`;
    const functionFooter = `\n}`;
    let functionBody = '';

    // Main routing logic
    let conditions = '';
    const returnProxy = `return "${proxyString}";`;
    const returnDirect = `return "DIRECT";`;

    if (entity.mode === 'directExcept') {
        if (domainsToProxy.length > 0) {
            conditions = domainsToProxy.map(domain => `shExpMatch(host, "${domain}")`).join(' ||\n        ');
            functionBody += `    // Main routing: Direct All, except for specific domains\n`;
            functionBody += `    if (${conditions}) {\n        ${returnProxy}\n    }\n    ${returnDirect}`;
        } else {
            functionBody += `    // Main routing: Direct All\n`;
            functionBody += `    ${returnDirect}`;
        }
    } else { // mode is 'proxyAll'
        if (domainsToBypass.length > 0) {
            conditions = domainsToBypass.map(domain => `shExpMatch(host, "${domain}")`).join(' ||\n        ');
            functionBody += `    // Main routing: Proxy All, except for bypass domains\n`;
            functionBody += `    if (${conditions}) {\n        ${returnDirect}\n    }\n    ${returnProxy}`;
        } else {
            functionBody += `    // Main routing: Proxy All\n`;
            functionBody += `    ${returnProxy}`;
        }
    }

    return `${functionHeader}${functionBody}${functionFooter}`;
}


/**
 * Generates and saves the PAC file for a given entity.
 * @param entityName The name of the entity (OU or User).
 * @param entityType The type of the entity ('ou' or 'user').
 */
export async function generateAndSavePacFile(entityName: string, entityType: EntityType) {
    try {
        const config = getEntityConfig(entityType);
        const pacContent = await generatePacContent(entityName, entityType);
        const entityDirPath = path.join(config.basePath, entityName);
        const pacFilePath = path.join(entityDirPath, `${entityName}.pac`);

        // Ensure the base directory exists
        await fs.mkdir(config.basePath, { recursive: true });
        
        // Ensure the entity-specific directory exists
        await fs.mkdir(entityDirPath, { recursive: true });

        // Write the file
        await fs.writeFile(pacFilePath, pacContent, 'utf-8');
        
        console.log(`PAC file for ${entityType} "${entityName}" generated successfully at ${pacFilePath}`);

    } catch (error) {
        console.error(`Failed to generate PAC file for ${entityType} "${entityName}":`, error);
        throw error;
    }
}


/**
 * Deletes the PAC file and its containing directory for a given entity.
 * @param entityName The name of the entity (OU or User).
 * @param entityType The type of the entity ('ou' or 'user').
 */
export async function deletePacFile(entityName: string, entityType: EntityType) {
    try {
        const config = getEntityConfig(entityType);
        const entityDirPath = path.join(config.basePath, entityName);
        await fs.rm(entityDirPath, { recursive: true, force: true });
        console.log(`PAC directory for ${entityType} "${entityName}" deleted successfully.`);
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.log(`PAC directory for ${entityType} "${entityName}" did not exist, nothing to delete.`);
            return;
        }
        console.error(`Failed to delete PAC directory for ${entityType} "${entityName}":`, error);
        throw error;
    }
}
