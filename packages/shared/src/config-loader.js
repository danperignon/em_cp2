/**
 * Configuration loader utility
 */
import { promises as fs } from 'fs';
import { join } from 'path';
export class ConfigLoader {
    static async loadServerConfig(serverPath) {
        const config = {};
        try {
            const claudeConfig = await fs.readFile(join(serverPath, 'claude-desktop.json'), 'utf-8');
            config.claudeDesktop = JSON.parse(claudeConfig);
        }
        catch {
            // Claude Desktop config not found
        }
        try {
            const clineConfig = await fs.readFile(join(serverPath, 'cline.json'), 'utf-8');
            config.cline = JSON.parse(clineConfig);
        }
        catch {
            // Cline config not found
        }
        return config;
    }
    static async saveServerConfig(serverPath, config) {
        if (config.claudeDesktop) {
            await fs.writeFile(join(serverPath, 'claude-desktop.json'), JSON.stringify(config.claudeDesktop, null, 2));
        }
        if (config.cline) {
            await fs.writeFile(join(serverPath, 'cline.json'), JSON.stringify(config.cline, null, 2));
        }
    }
}
