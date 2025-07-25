/**
 * Session Validator
 *
 * Comprehensive validation engine for reasoning sessions that provides:
 * - Deep state consistency validation
 * - Corruption detection and repair
 * - Session health scoring
 * - Dependency validation
 */
import type { ReasoningState } from '../types/index.js';
import type { SessionMetadata } from './state-storage-manager.js';
export interface SessionHealthReport {
    sessionId: string;
    healthScore: number;
    status: 'healthy' | 'warning' | 'critical' | 'corrupted';
    issues: ValidationIssue[];
    recommendations: string[];
    canAutoRepair: boolean;
    lastValidationTime: number;
}
export interface ValidationIssue {
    severity: 'info' | 'warning' | 'error' | 'critical';
    category: 'structure' | 'dependencies' | 'data' | 'consistency' | 'performance';
    code: string;
    message: string;
    location?: string;
    canRepair: boolean;
    repairAction?: string;
}
export interface ValidationConfig {
    enableDeepValidation: boolean;
    enableDependencyCheck: boolean;
    enableDataIntegrityCheck: boolean;
    enablePerformanceCheck: boolean;
    maxHealthScore: number;
    healthThresholds: {
        healthy: number;
        warning: number;
        critical: number;
        corrupted: number;
    };
}
export declare class SessionValidator {
    private logger;
    private config;
    constructor(config?: Partial<ValidationConfig>);
    /**
     * Validate a complete reasoning session and generate health report
     */
    validateSession(state: ReasoningState, metadata?: SessionMetadata): Promise<SessionHealthReport>;
    /**
     * Attempt to auto-repair issues found in validation
     */
    repairSession(state: ReasoningState, healthReport: SessionHealthReport): Promise<{
        success: boolean;
        repairedState?: ReasoningState;
        repairedIssues: string[];
        remainingIssues: ValidationIssue[];
        error?: string;
    }>;
    private validateStructure;
    private validateDataIntegrity;
    private validateDependencies;
    private validateConsistency;
    private validatePerformance;
    private validateDeepStructure;
    private hasCircularDependency;
    private calculateHealthScore;
    private determineHealthStatus;
    private generateRecommendations;
    private repairIssue;
}
//# sourceMappingURL=session-validator.d.ts.map