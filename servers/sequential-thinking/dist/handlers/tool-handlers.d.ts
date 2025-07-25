/**
 * MCP Tool Handlers for Sequential Thinking Server
 *
 * Implements the decompose_problem tool with comprehensive validation,
 * error handling, and integration with the core reasoning engine.
 */
import type { ReasoningState, DecompositionStrategy } from '../types/index.js';
import type { SessionMetadata } from '../engine/state-storage-manager.js';
import { ChainManager } from '../engine/chain-manager.js';
export declare class ToolHandlers {
    private logger;
    private problemAnalyzer;
    private decompositionEngine;
    private chainManager;
    private validationEngine;
    private memoryIntegration;
    private filesystemIntegration;
    constructor();
    /**
     * Initialize tool handlers with persistent storage
     */
    initialize(): Promise<void>;
    /**
     * Handle decompose_problem tool calls
     */
    handleDecomposeProblem(args: {
        problem_description: string;
        decomposition_strategy?: DecompositionStrategy;
        depth_limit?: number;
    }): Promise<{
        success: boolean;
        data?: ReasoningState;
        error?: string;
        metadata?: any;
    }>;
    /**
     * Validate input parameters for decompose_problem tool
     */
    private validateDecomposeProblemInput;
    /**
     * Classify problem type based on description
     */
    private classifyProblemType;
    /**
     * Generate problem fingerprint for similarity matching
     */
    private generateProblemFingerprint;
    /**
     * Handle save_session tool calls
     */
    handleSaveSession(args: {
        session_id: string;
        status?: SessionMetadata['status'];
        create_backup?: boolean;
    }): Promise<{
        success: boolean;
        sessionPath?: string;
        error?: string;
    }>;
    /**
     * Handle load_session tool calls
     */
    handleLoadSession(args: {
        session_id: string;
    }): Promise<{
        success: boolean;
        state?: ReasoningState;
        metadata?: SessionMetadata;
        error?: string;
    }>;
    /**
     * Handle list_sessions tool calls
     */
    handleListSessions(args: {
        status?: string[];
        strategy?: string[];
        date_range?: {
            from: number;
            to: number;
        };
        limit?: number;
        sort_by?: 'createdAt' | 'lastModified' | 'strategy';
        sort_order?: 'asc' | 'desc';
    }): Promise<{
        success: boolean;
        sessions?: SessionMetadata[];
        error?: string;
    }>;
    /**
     * Handle resume_session tool calls
     */
    handleResumeSession(args: {
        session_id: string;
        continue_from_step?: number;
    }): Promise<{
        success: boolean;
        state?: ReasoningState;
        error?: string;
    }>;
    /**
     * Handle archive_session tool calls
     */
    handleArchiveSession(args: {
        session_id: string;
    }): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * Handle get_storage_stats tool calls
     */
    handleGetStorageStats(): Promise<{
        success: boolean;
        stats?: {
            totalSessions: number;
            activeSessions: number;
            completedSessions: number;
            totalSizeBytes: number;
            oldestSession: number;
            newestSession: number;
        };
        error?: string;
    }>;
    /**
     * Validate session health and get detailed health report
     */
    handleValidateSessionHealth(args: {
        session_id: string;
        attempt_auto_repair?: boolean;
    }): Promise<{
        success: boolean;
        health_report?: any;
        repair_result?: any;
        error?: string;
    }>;
    /**
     * Recover a corrupted or failed session
     */
    handleRecoverSession(args: {
        session_id: string;
        error_type?: 'corruption' | 'missing_data' | 'dependency_failure' | 'validation_failure' | 'timeout' | 'unknown';
        max_attempts?: number;
    }): Promise<{
        success: boolean;
        recovery_result?: any;
        recovered_state?: any;
        error?: string;
    }>;
    /**
     * Get session event history and lifecycle events
     */
    handleGetSessionEvents(args: {
        session_id?: string;
        event_type?: string;
        start_time?: number;
        end_time?: number;
        limit?: number;
    }): Promise<{
        success: boolean;
        events?: any[];
        total_events?: number;
        error?: string;
    }>;
    /**
     * Get comprehensive event system metrics
     */
    handleGetEventMetrics(): Promise<{
        success: boolean;
        metrics?: any;
        error?: string;
    }>;
    /**
     * Get restoration system status and metrics
     */
    handleGetRestorationMetrics(): Promise<{
        success: boolean;
        restoration_metrics?: any;
        error?: string;
    }>;
    /**
     * Subscribe to session lifecycle events (for monitoring)
     */
    handleSubscribeToEvents(args: {
        event_types: string[];
        priority?: number;
        subscription_id?: string;
    }): Promise<{
        success: boolean;
        subscription_id?: string;
        error?: string;
    }>;
    /**
     * Unsubscribe from session events
     */
    handleUnsubscribeFromEvents(args: {
        subscription_id: string;
    }): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * Handle resolve_conflicts tool calls
     */
    handleResolveConflicts(args: {
        session_id: string;
        conflict_id?: string;
        force_resolve_all?: boolean;
    }): Promise<{
        success: boolean;
        resolved_conflicts?: any[];
        conflict_stats?: any;
        error?: string;
    }>;
    /**
     * Handle get_conflict_stats tool calls
     */
    handleGetConflictStats(): Promise<{
        success: boolean;
        conflict_stats?: any;
        conflict_history?: any[];
        error?: string;
    }>;
    /**
     * Handle update_state_with_conflict_resolution tool calls
     */
    handleUpdateStateWithConflictResolution(args: {
        session_id: string;
        client_id: string;
        state_update: any;
    }): Promise<{
        success: boolean;
        updated_state?: any;
        conflicts?: any[];
        resolutions?: any[];
        error?: string;
    }>;
    /**
     * Get the ChainManager instance for direct access (used by MCP resources)
     */
    getChainManager(): ChainManager;
    /**
     * Get available tools metadata for MCP server
     */
    getToolsMetadata(): ({
        name: string;
        description: string;
        inputSchema: {
            type: "object";
            properties: {
                problem_description: {
                    type: string;
                    description: string;
                    minLength: number;
                    maxLength: number;
                };
                decomposition_strategy: {
                    type: string;
                    enum: string[];
                    description: string;
                };
                depth_limit: {
                    type: string;
                    minimum: number;
                    maximum: number;
                    default: number;
                    description: string;
                };
                session_id?: undefined;
                status?: undefined;
                create_backup?: undefined;
                strategy?: undefined;
                date_range?: undefined;
                limit?: undefined;
                sort_by?: undefined;
                sort_order?: undefined;
                continue_from_step?: undefined;
                attempt_auto_repair?: undefined;
                error_type?: undefined;
                max_attempts?: undefined;
                event_type?: undefined;
                start_time?: undefined;
                end_time?: undefined;
                event_types?: undefined;
                priority?: undefined;
                subscription_id?: undefined;
                conflict_id?: undefined;
                force_resolve_all?: undefined;
                client_id?: undefined;
                state_update?: undefined;
            };
            required: string[];
        };
    } | {
        name: string;
        description: string;
        inputSchema: {
            type: "object";
            properties: {
                session_id: {
                    type: string;
                    description: string;
                };
                status: {
                    type: string;
                    enum: string[];
                    description: string;
                    items?: undefined;
                };
                create_backup: {
                    type: string;
                    description: string;
                    default: boolean;
                };
                problem_description?: undefined;
                decomposition_strategy?: undefined;
                depth_limit?: undefined;
                strategy?: undefined;
                date_range?: undefined;
                limit?: undefined;
                sort_by?: undefined;
                sort_order?: undefined;
                continue_from_step?: undefined;
                attempt_auto_repair?: undefined;
                error_type?: undefined;
                max_attempts?: undefined;
                event_type?: undefined;
                start_time?: undefined;
                end_time?: undefined;
                event_types?: undefined;
                priority?: undefined;
                subscription_id?: undefined;
                conflict_id?: undefined;
                force_resolve_all?: undefined;
                client_id?: undefined;
                state_update?: undefined;
            };
            required: string[];
        };
    } | {
        name: string;
        description: string;
        inputSchema: {
            type: "object";
            properties: {
                session_id: {
                    type: string;
                    description: string;
                };
                problem_description?: undefined;
                decomposition_strategy?: undefined;
                depth_limit?: undefined;
                status?: undefined;
                create_backup?: undefined;
                strategy?: undefined;
                date_range?: undefined;
                limit?: undefined;
                sort_by?: undefined;
                sort_order?: undefined;
                continue_from_step?: undefined;
                attempt_auto_repair?: undefined;
                error_type?: undefined;
                max_attempts?: undefined;
                event_type?: undefined;
                start_time?: undefined;
                end_time?: undefined;
                event_types?: undefined;
                priority?: undefined;
                subscription_id?: undefined;
                conflict_id?: undefined;
                force_resolve_all?: undefined;
                client_id?: undefined;
                state_update?: undefined;
            };
            required: string[];
        };
    } | {
        name: string;
        description: string;
        inputSchema: {
            type: "object";
            properties: {
                status: {
                    type: string;
                    items: {
                        type: string;
                        enum: string[];
                    };
                    description: string;
                    enum?: undefined;
                };
                strategy: {
                    type: string;
                    items: {
                        type: string;
                    };
                    description: string;
                };
                date_range: {
                    type: string;
                    properties: {
                        from: {
                            type: string;
                            description: string;
                        };
                        to: {
                            type: string;
                            description: string;
                        };
                    };
                    description: string;
                };
                limit: {
                    type: string;
                    minimum: number;
                    maximum: number;
                    description: string;
                    default?: undefined;
                };
                sort_by: {
                    type: string;
                    enum: string[];
                    description: string;
                };
                sort_order: {
                    type: string;
                    enum: string[];
                    description: string;
                    default: string;
                };
                problem_description?: undefined;
                decomposition_strategy?: undefined;
                depth_limit?: undefined;
                session_id?: undefined;
                create_backup?: undefined;
                continue_from_step?: undefined;
                attempt_auto_repair?: undefined;
                error_type?: undefined;
                max_attempts?: undefined;
                event_type?: undefined;
                start_time?: undefined;
                end_time?: undefined;
                event_types?: undefined;
                priority?: undefined;
                subscription_id?: undefined;
                conflict_id?: undefined;
                force_resolve_all?: undefined;
                client_id?: undefined;
                state_update?: undefined;
            };
            required?: undefined;
        };
    } | {
        name: string;
        description: string;
        inputSchema: {
            type: "object";
            properties: {
                session_id: {
                    type: string;
                    description: string;
                };
                continue_from_step: {
                    type: string;
                    minimum: number;
                    description: string;
                };
                problem_description?: undefined;
                decomposition_strategy?: undefined;
                depth_limit?: undefined;
                status?: undefined;
                create_backup?: undefined;
                strategy?: undefined;
                date_range?: undefined;
                limit?: undefined;
                sort_by?: undefined;
                sort_order?: undefined;
                attempt_auto_repair?: undefined;
                error_type?: undefined;
                max_attempts?: undefined;
                event_type?: undefined;
                start_time?: undefined;
                end_time?: undefined;
                event_types?: undefined;
                priority?: undefined;
                subscription_id?: undefined;
                conflict_id?: undefined;
                force_resolve_all?: undefined;
                client_id?: undefined;
                state_update?: undefined;
            };
            required: string[];
        };
    } | {
        name: string;
        description: string;
        inputSchema: {
            type: "object";
            properties: {
                problem_description?: undefined;
                decomposition_strategy?: undefined;
                depth_limit?: undefined;
                session_id?: undefined;
                status?: undefined;
                create_backup?: undefined;
                strategy?: undefined;
                date_range?: undefined;
                limit?: undefined;
                sort_by?: undefined;
                sort_order?: undefined;
                continue_from_step?: undefined;
                attempt_auto_repair?: undefined;
                error_type?: undefined;
                max_attempts?: undefined;
                event_type?: undefined;
                start_time?: undefined;
                end_time?: undefined;
                event_types?: undefined;
                priority?: undefined;
                subscription_id?: undefined;
                conflict_id?: undefined;
                force_resolve_all?: undefined;
                client_id?: undefined;
                state_update?: undefined;
            };
            required?: undefined;
        };
    } | {
        name: string;
        description: string;
        inputSchema: {
            type: "object";
            properties: {
                session_id: {
                    type: string;
                    description: string;
                };
                attempt_auto_repair: {
                    type: string;
                    description: string;
                    default: boolean;
                };
                problem_description?: undefined;
                decomposition_strategy?: undefined;
                depth_limit?: undefined;
                status?: undefined;
                create_backup?: undefined;
                strategy?: undefined;
                date_range?: undefined;
                limit?: undefined;
                sort_by?: undefined;
                sort_order?: undefined;
                continue_from_step?: undefined;
                error_type?: undefined;
                max_attempts?: undefined;
                event_type?: undefined;
                start_time?: undefined;
                end_time?: undefined;
                event_types?: undefined;
                priority?: undefined;
                subscription_id?: undefined;
                conflict_id?: undefined;
                force_resolve_all?: undefined;
                client_id?: undefined;
                state_update?: undefined;
            };
            required: string[];
        };
    } | {
        name: string;
        description: string;
        inputSchema: {
            type: "object";
            properties: {
                session_id: {
                    type: string;
                    description: string;
                };
                error_type: {
                    type: string;
                    enum: string[];
                    description: string;
                    default: string;
                };
                max_attempts: {
                    type: string;
                    minimum: number;
                    maximum: number;
                    description: string;
                    default: number;
                };
                problem_description?: undefined;
                decomposition_strategy?: undefined;
                depth_limit?: undefined;
                status?: undefined;
                create_backup?: undefined;
                strategy?: undefined;
                date_range?: undefined;
                limit?: undefined;
                sort_by?: undefined;
                sort_order?: undefined;
                continue_from_step?: undefined;
                attempt_auto_repair?: undefined;
                event_type?: undefined;
                start_time?: undefined;
                end_time?: undefined;
                event_types?: undefined;
                priority?: undefined;
                subscription_id?: undefined;
                conflict_id?: undefined;
                force_resolve_all?: undefined;
                client_id?: undefined;
                state_update?: undefined;
            };
            required: string[];
        };
    } | {
        name: string;
        description: string;
        inputSchema: {
            type: "object";
            properties: {
                session_id: {
                    type: string;
                    description: string;
                };
                event_type: {
                    type: string;
                    enum: string[];
                    description: string;
                };
                start_time: {
                    type: string;
                    description: string;
                };
                end_time: {
                    type: string;
                    description: string;
                };
                limit: {
                    type: string;
                    minimum: number;
                    maximum: number;
                    description: string;
                    default: number;
                };
                problem_description?: undefined;
                decomposition_strategy?: undefined;
                depth_limit?: undefined;
                status?: undefined;
                create_backup?: undefined;
                strategy?: undefined;
                date_range?: undefined;
                sort_by?: undefined;
                sort_order?: undefined;
                continue_from_step?: undefined;
                attempt_auto_repair?: undefined;
                error_type?: undefined;
                max_attempts?: undefined;
                event_types?: undefined;
                priority?: undefined;
                subscription_id?: undefined;
                conflict_id?: undefined;
                force_resolve_all?: undefined;
                client_id?: undefined;
                state_update?: undefined;
            };
            required?: undefined;
        };
    } | {
        name: string;
        description: string;
        inputSchema: {
            type: "object";
            properties: {
                event_types: {
                    type: string;
                    items: {
                        type: string;
                        enum: string[];
                    };
                    description: string;
                    minItems: number;
                };
                priority: {
                    type: string;
                    minimum: number;
                    maximum: number;
                    description: string;
                    default: number;
                };
                subscription_id: {
                    type: string;
                    description: string;
                };
                problem_description?: undefined;
                decomposition_strategy?: undefined;
                depth_limit?: undefined;
                session_id?: undefined;
                status?: undefined;
                create_backup?: undefined;
                strategy?: undefined;
                date_range?: undefined;
                limit?: undefined;
                sort_by?: undefined;
                sort_order?: undefined;
                continue_from_step?: undefined;
                attempt_auto_repair?: undefined;
                error_type?: undefined;
                max_attempts?: undefined;
                event_type?: undefined;
                start_time?: undefined;
                end_time?: undefined;
                conflict_id?: undefined;
                force_resolve_all?: undefined;
                client_id?: undefined;
                state_update?: undefined;
            };
            required: string[];
        };
    } | {
        name: string;
        description: string;
        inputSchema: {
            type: "object";
            properties: {
                subscription_id: {
                    type: string;
                    description: string;
                };
                problem_description?: undefined;
                decomposition_strategy?: undefined;
                depth_limit?: undefined;
                session_id?: undefined;
                status?: undefined;
                create_backup?: undefined;
                strategy?: undefined;
                date_range?: undefined;
                limit?: undefined;
                sort_by?: undefined;
                sort_order?: undefined;
                continue_from_step?: undefined;
                attempt_auto_repair?: undefined;
                error_type?: undefined;
                max_attempts?: undefined;
                event_type?: undefined;
                start_time?: undefined;
                end_time?: undefined;
                event_types?: undefined;
                priority?: undefined;
                conflict_id?: undefined;
                force_resolve_all?: undefined;
                client_id?: undefined;
                state_update?: undefined;
            };
            required: string[];
        };
    } | {
        name: string;
        description: string;
        inputSchema: {
            type: "object";
            properties: {
                session_id: {
                    type: string;
                    description: string;
                };
                conflict_id: {
                    type: string;
                    description: string;
                };
                force_resolve_all: {
                    type: string;
                    description: string;
                    default: boolean;
                };
                problem_description?: undefined;
                decomposition_strategy?: undefined;
                depth_limit?: undefined;
                status?: undefined;
                create_backup?: undefined;
                strategy?: undefined;
                date_range?: undefined;
                limit?: undefined;
                sort_by?: undefined;
                sort_order?: undefined;
                continue_from_step?: undefined;
                attempt_auto_repair?: undefined;
                error_type?: undefined;
                max_attempts?: undefined;
                event_type?: undefined;
                start_time?: undefined;
                end_time?: undefined;
                event_types?: undefined;
                priority?: undefined;
                subscription_id?: undefined;
                client_id?: undefined;
                state_update?: undefined;
            };
            required: string[];
        };
    } | {
        name: string;
        description: string;
        inputSchema: {
            type: "object";
            properties: {
                session_id: {
                    type: string;
                    description: string;
                };
                client_id: {
                    type: string;
                    description: string;
                };
                state_update: {
                    type: string;
                    description: string;
                };
                problem_description?: undefined;
                decomposition_strategy?: undefined;
                depth_limit?: undefined;
                status?: undefined;
                create_backup?: undefined;
                strategy?: undefined;
                date_range?: undefined;
                limit?: undefined;
                sort_by?: undefined;
                sort_order?: undefined;
                continue_from_step?: undefined;
                attempt_auto_repair?: undefined;
                error_type?: undefined;
                max_attempts?: undefined;
                event_type?: undefined;
                start_time?: undefined;
                end_time?: undefined;
                event_types?: undefined;
                priority?: undefined;
                subscription_id?: undefined;
                conflict_id?: undefined;
                force_resolve_all?: undefined;
            };
            required: string[];
        };
    })[];
}
//# sourceMappingURL=tool-handlers.d.ts.map