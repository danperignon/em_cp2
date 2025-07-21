/**
 * Configuration loader utility
 */
import type { CrossClientServerConfig } from '@em-cp2/types';
export declare class ConfigLoader {
    static loadServerConfig(serverPath: string): Promise<CrossClientServerConfig>;
    static saveServerConfig(serverPath: string, config: CrossClientServerConfig): Promise<void>;
}
//# sourceMappingURL=config-loader.d.ts.map