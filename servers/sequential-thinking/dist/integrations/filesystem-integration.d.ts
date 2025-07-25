/**
 * Filesystem Integration
 *
 * Provides reasoning artifact generation by integrating with the
 * EM_CP2 Filesystem server for creating concrete deliverables.
 */
import type { ReasoningState } from '../types/index.js';
export interface FilesystemIntegrationOptions {
    baseDirectory?: string;
    createWorkspaces?: boolean;
    generateMarkdown?: boolean;
    generateJSON?: boolean;
    includeMetadata?: boolean;
}
export interface ArtifactManifest {
    reasoningStateId: string;
    workspacePath: string;
    artifacts: GeneratedArtifact[];
    createdAt: number;
    totalFiles: number;
}
export interface GeneratedArtifact {
    type: 'markdown' | 'json' | 'text' | 'template';
    filename: string;
    path: string;
    description: string;
    size: number;
    createdAt: number;
}
export declare class FilesystemIntegration {
    private logger;
    private baseDirectory;
    private isAvailable;
    constructor(options?: FilesystemIntegrationOptions);
    /**
     * Initialize connection to Filesystem server
     */
    private initializeFilesystemConnection;
    /**
     * Generate complete reasoning artifacts for a solution
     */
    generateReasoningArtifacts(reasoningState: ReasoningState, options?: FilesystemIntegrationOptions): Promise<ArtifactManifest>;
    /**
     * Create a dedicated workspace for the reasoning session
     */
    private createWorkspace;
    /**
     * Generate solution overview markdown
     */
    private generateSolutionOverview;
    /**
     * Generate step-by-step execution guide
     */
    private generateStepByStepGuide;
    /**
     * Generate JSON export of complete reasoning state
     */
    private generateJSONExport;
    /**
     * Generate reusable template based on successful solution
     */
    private generateReusableTemplate;
    /**
     * Generate individual artifacts for each reasoning step
     */
    private generateStepArtifacts;
    private buildSolutionOverviewContent;
    private buildStepByStepContent;
    private buildTemplateContent;
    private buildStepContent;
    private createDirectory;
    private writeFile;
    private saveManifest;
    private extractProblemType;
    private sanitizeFilename;
    private createEmptyManifest;
    /**
     * Check if Filesystem integration is available
     */
    isFilesystemAvailable(): boolean;
    /**
     * Get integration statistics
     */
    getIntegrationStats(): Promise<{
        isAvailable: boolean;
        baseDirectory: string;
        totalWorkspaces: number;
        totalArtifacts: number;
    }>;
}
//# sourceMappingURL=filesystem-integration.d.ts.map