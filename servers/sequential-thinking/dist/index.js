#!/usr/bin/env node
/**
 * Sequential Thinking MCP Server
 *
 * Advanced cognitive reasoning server providing structured problem-solving,
 * adaptive strategy selection, and persistent state management.
 *
 * Features:
 * - Problem decomposition with multiple strategies
 * - Step-by-step reasoning chains with validation
 * - Adaptive strategy selection based on performance
 * - Integration with Memory, Filesystem, and Git servers
 * - Metacognitive monitoring and reflection
 */
import { MCPServer } from '@em-cp2/core';
import { Logger } from '@em-cp2/shared';
import { ToolHandlers } from './handlers/tool-handlers.js';
import { CallToolRequestSchema, ListToolsRequestSchema, ListResourcesRequestSchema, ReadResourceRequestSchema, ListPromptsRequestSchema, GetPromptRequestSchema } from '@modelcontextprotocol/sdk/types.js';
class SequentialThinkingServer extends MCPServer {
    logger = new Logger('sequential-thinking');
    toolHandlers;
    constructor() {
        super({
            name: 'sequential-thinking',
            version: '2.0.0',
            description: 'Advanced cognitive reasoning server with adaptive problem-solving capabilities',
            capabilities: {
                tools: {},
                resources: {},
                prompts: {}
            }
        });
        this.toolHandlers = new ToolHandlers();
        this.logger.info('Sequential Thinking server initialized with core engine');
    }
    async setupHandlers() {
        // Make sure tool handlers are initialized
        if (!this.toolHandlers) {
            this.toolHandlers = new ToolHandlers();
        }
        // Initialize tool handlers with persistent storage
        try {
            await this.toolHandlers.initialize();
        }
        catch (error) {
            this.logger.error('Failed to initialize tool handlers with persistence:', error);
            this.logger.warn('Continuing without persistent storage');
        }
        this.setupServerInterface();
        this.setupMCPHandlers();
        this.logger.info('All handlers configured - server ready for problem decomposition');
    }
    setupServerInterface() {
        // Make sure logger is initialized
        if (!this.logger) {
            this.logger = new Logger('sequential-thinking');
        }
        // Define Resources (Phase 3.2 - Enhanced with persistent state management)
        this.resources = [
            {
                uri: 'thinking://current_state',
                name: 'Current Thinking State',
                description: 'Live problem-solving state with active sessions',
                mimeType: 'application/json'
            },
            {
                uri: 'thinking://pattern_library',
                name: 'Pattern Library',
                description: 'Reusable problem-solving templates and patterns',
                mimeType: 'application/json'
            },
            {
                uri: 'thinking://quality_metrics',
                name: 'Quality Assessment Metrics',
                description: 'Solution quality metrics and validation results',
                mimeType: 'application/json'
            },
            {
                uri: 'thinking://saved_sessions',
                name: 'Saved Sessions',
                description: 'List of all saved reasoning sessions with metadata',
                mimeType: 'application/json'
            },
            {
                uri: 'thinking://session_history',
                name: 'Session History',
                description: 'Historical session data and trends',
                mimeType: 'application/json'
            },
            {
                uri: 'thinking://session_stats',
                name: 'Session Statistics',
                description: 'Storage statistics and usage metrics',
                mimeType: 'application/json'
            },
            {
                uri: 'thinking://session_events',
                name: 'Session Events',
                description: 'Real-time session lifecycle events and event history',
                mimeType: 'application/json'
            },
            {
                uri: 'thinking://event_metrics',
                name: 'Event System Metrics',
                description: 'Event system performance and handler statistics',
                mimeType: 'application/json'
            },
            {
                uri: 'thinking://restoration_status',
                name: 'Restoration Status',
                description: 'Progressive restoration system status and metrics',
                mimeType: 'application/json'
            },
            {
                uri: 'thinking://recovery_status',
                name: 'Recovery Status',
                description: 'Session recovery system status and statistics',
                mimeType: 'application/json'
            },
            {
                uri: 'thinking://conflict_status',
                name: 'Conflict Status',
                description: 'Active conflicts and resolution statistics for multi-client sessions',
                mimeType: 'application/json'
            },
            {
                uri: 'thinking://conflict_history',
                name: 'Conflict History',
                description: 'Historical conflict resolutions and performance metrics',
                mimeType: 'application/json'
            }
        ];
        // Define Prompts (Phase 3.2 - Enhanced with session management)
        this.prompts = [
            {
                name: 'analyze_problem_structure',
                description: 'Analyze problem structure and identify solution components using cognitive patterns',
                arguments: [
                    {
                        name: 'problem_description',
                        description: 'Detailed description of the problem to analyze',
                        required: true
                    },
                    {
                        name: 'include_patterns',
                        description: 'Include pattern matching analysis in the output',
                        required: false
                    }
                ]
            },
            {
                name: 'generate_solution_strategy',
                description: 'Generate comprehensive solution strategy based on problem analysis',
                arguments: [
                    {
                        name: 'problem_context',
                        description: 'Problem context and constraints',
                        required: true
                    },
                    {
                        name: 'strategy_preference',
                        description: 'Preferred decomposition strategy if any',
                        required: false
                    }
                ]
            },
            {
                name: 'validate_reasoning_chain',
                description: 'Validate a reasoning chain for quality and feasibility',
                arguments: [
                    {
                        name: 'reasoning_state',
                        description: 'The reasoning state to validate',
                        required: true
                    }
                ]
            },
            {
                name: 'analyze_session_patterns',
                description: 'Analyze patterns and trends across multiple reasoning sessions',
                arguments: [
                    {
                        name: 'session_ids',
                        description: 'Array of session IDs to analyze (optional, uses all if not provided)',
                        required: false
                    },
                    {
                        name: 'focus_area',
                        description: 'Specific area to focus analysis on (strategies, success_rates, common_patterns)',
                        required: false
                    }
                ]
            },
            {
                name: 'compare_sessions',
                description: 'Compare reasoning approaches and outcomes between sessions',
                arguments: [
                    {
                        name: 'session_a_id',
                        description: 'ID of the first session to compare',
                        required: true
                    },
                    {
                        name: 'session_b_id',
                        description: 'ID of the second session to compare',
                        required: true
                    },
                    {
                        name: 'comparison_aspects',
                        description: 'Aspects to compare (strategy, efficiency, quality, steps)',
                        required: false
                    }
                ]
            }
        ];
        // Define Tools (Phase 2 - Full implementation)
        this.tools = this.toolHandlers.getToolsMetadata();
        this.logger.info(`Server interface configured: ${this.resources.length} resources, ${this.prompts.length} prompts, ${this.tools.length} tools`);
    }
    setupMCPHandlers() {
        // Tool handlers
        this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
            tools: this.tools || []
        }));
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            try {
                switch (name) {
                    case 'decompose_problem':
                        const result = await this.toolHandlers.handleDecomposeProblem(args);
                        if (result.success) {
                            return {
                                content: [
                                    {
                                        type: 'text',
                                        text: JSON.stringify(result.data, null, 2)
                                    }
                                ]
                            };
                        }
                        else {
                            return {
                                content: [
                                    {
                                        type: 'text',
                                        text: `Error: ${result.error}`
                                    }
                                ],
                                isError: true
                            };
                        }
                    case 'save_session':
                        const saveResult = await this.toolHandlers.handleSaveSession(args);
                        return {
                            content: [
                                {
                                    type: 'text',
                                    text: JSON.stringify(saveResult, null, 2)
                                }
                            ],
                            isError: !saveResult.success
                        };
                    case 'load_session':
                        const loadResult = await this.toolHandlers.handleLoadSession(args);
                        return {
                            content: [
                                {
                                    type: 'text',
                                    text: JSON.stringify(loadResult, null, 2)
                                }
                            ],
                            isError: !loadResult.success
                        };
                    case 'list_sessions':
                        const listResult = await this.toolHandlers.handleListSessions(args);
                        return {
                            content: [
                                {
                                    type: 'text',
                                    text: JSON.stringify(listResult, null, 2)
                                }
                            ],
                            isError: !listResult.success
                        };
                    case 'resume_session':
                        const resumeResult = await this.toolHandlers.handleResumeSession(args);
                        return {
                            content: [
                                {
                                    type: 'text',
                                    text: JSON.stringify(resumeResult, null, 2)
                                }
                            ],
                            isError: !resumeResult.success
                        };
                    case 'archive_session':
                        const archiveResult = await this.toolHandlers.handleArchiveSession(args);
                        return {
                            content: [
                                {
                                    type: 'text',
                                    text: JSON.stringify(archiveResult, null, 2)
                                }
                            ],
                            isError: !archiveResult.success
                        };
                    case 'get_storage_stats':
                        const statsResult = await this.toolHandlers.handleGetStorageStats();
                        return {
                            content: [
                                {
                                    type: 'text',
                                    text: JSON.stringify(statsResult, null, 2)
                                }
                            ],
                            isError: !statsResult.success
                        };
                    case 'validate_session_health':
                        const healthResult = await this.toolHandlers.handleValidateSessionHealth(args);
                        return {
                            content: [
                                {
                                    type: 'text',
                                    text: JSON.stringify(healthResult, null, 2)
                                }
                            ],
                            isError: !healthResult.success
                        };
                    case 'recover_session':
                        const recoveryResult = await this.toolHandlers.handleRecoverSession(args);
                        return {
                            content: [
                                {
                                    type: 'text',
                                    text: JSON.stringify(recoveryResult, null, 2)
                                }
                            ],
                            isError: !recoveryResult.success
                        };
                    case 'get_session_events':
                        const eventsResult = await this.toolHandlers.handleGetSessionEvents(args);
                        return {
                            content: [
                                {
                                    type: 'text',
                                    text: JSON.stringify(eventsResult, null, 2)
                                }
                            ],
                            isError: !eventsResult.success
                        };
                    case 'get_event_metrics':
                        const eventMetricsResult = await this.toolHandlers.handleGetEventMetrics();
                        return {
                            content: [
                                {
                                    type: 'text',
                                    text: JSON.stringify(eventMetricsResult, null, 2)
                                }
                            ],
                            isError: !eventMetricsResult.success
                        };
                    case 'get_restoration_metrics':
                        const restorationMetricsResult = await this.toolHandlers.handleGetRestorationMetrics();
                        return {
                            content: [
                                {
                                    type: 'text',
                                    text: JSON.stringify(restorationMetricsResult, null, 2)
                                }
                            ],
                            isError: !restorationMetricsResult.success
                        };
                    case 'subscribe_to_events':
                        const subscribeResult = await this.toolHandlers.handleSubscribeToEvents(args);
                        return {
                            content: [
                                {
                                    type: 'text',
                                    text: JSON.stringify(subscribeResult, null, 2)
                                }
                            ],
                            isError: !subscribeResult.success
                        };
                    case 'unsubscribe_from_events':
                        const unsubscribeResult = await this.toolHandlers.handleUnsubscribeFromEvents(args);
                        return {
                            content: [
                                {
                                    type: 'text',
                                    text: JSON.stringify(unsubscribeResult, null, 2)
                                }
                            ],
                            isError: !unsubscribeResult.success
                        };
                    case 'resolve_conflicts':
                        const resolveConflictsResult = await this.toolHandlers.handleResolveConflicts(args);
                        return {
                            content: [
                                {
                                    type: 'text',
                                    text: JSON.stringify(resolveConflictsResult, null, 2)
                                }
                            ],
                            isError: !resolveConflictsResult.success
                        };
                    case 'get_conflict_stats':
                        const conflictStatsResult = await this.toolHandlers.handleGetConflictStats();
                        return {
                            content: [
                                {
                                    type: 'text',
                                    text: JSON.stringify(conflictStatsResult, null, 2)
                                }
                            ],
                            isError: !conflictStatsResult.success
                        };
                    case 'update_state_with_conflict_resolution':
                        const updateStateResult = await this.toolHandlers.handleUpdateStateWithConflictResolution(args);
                        return {
                            content: [
                                {
                                    type: 'text',
                                    text: JSON.stringify(updateStateResult, null, 2)
                                }
                            ],
                            isError: !updateStateResult.success
                        };
                    default:
                        return {
                            content: [
                                {
                                    type: 'text',
                                    text: `Unknown tool: ${name}`
                                }
                            ],
                            isError: true
                        };
                }
            }
            catch (error) {
                this.logger.error(`Error handling tool ${name}:`, error);
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Tool execution error: ${error instanceof Error ? error.message : 'Unknown error'}`
                        }
                    ],
                    isError: true
                };
            }
        });
        // Resource handlers
        this.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
            resources: this.resources || []
        }));
        this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
            const { uri } = request.params;
            try {
                switch (uri) {
                    case 'thinking://current_state':
                        const memoryStats = await this.toolHandlers['memoryIntegration']?.getIntegrationStats() || {
                            isAvailable: false,
                            totalPatterns: 0,
                            totalSolutions: 0,
                            lastSync: 0
                        };
                        const filesystemStats = await this.toolHandlers['filesystemIntegration']?.getIntegrationStats() || {
                            isAvailable: false,
                            baseDirectory: '',
                            totalWorkspaces: 0,
                            totalArtifacts: 0
                        };
                        return {
                            contents: [
                                {
                                    uri,
                                    mimeType: 'application/json',
                                    text: JSON.stringify({
                                        activeStates: this.toolHandlers['chainManager']?.getActiveStates().length || 0,
                                        timestamp: Date.now(),
                                        serverStatus: 'active',
                                        integrations: {
                                            memory: memoryStats,
                                            filesystem: filesystemStats
                                        }
                                    }, null, 2)
                                }
                            ]
                        };
                    case 'thinking://pattern_library':
                        return {
                            contents: [
                                {
                                    uri,
                                    mimeType: 'application/json',
                                    text: JSON.stringify({
                                        availablePatterns: [
                                            'analytical_breakdown',
                                            'creative_exploration',
                                            'procedural_execution',
                                            'diagnostic_investigation',
                                            'strategic_planning',
                                            'research_synthesis',
                                            'optimization_tuning'
                                        ],
                                        strategies: ['top_down', 'bottom_up', 'divide_conquer', 'incremental', 'parallel', 'iterative']
                                    }, null, 2)
                                }
                            ]
                        };
                    case 'thinking://quality_metrics':
                        return {
                            contents: [
                                {
                                    uri,
                                    mimeType: 'application/json',
                                    text: JSON.stringify({
                                        qualityDimensions: [
                                            'completeness',
                                            'feasibility',
                                            'efficiency',
                                            'robustness',
                                            'innovation',
                                            'confidence'
                                        ],
                                        validationCriteria: [
                                            'logicalConsistency',
                                            'feasibilityCheck',
                                            'constraintCompliance',
                                            'stakeholderAlignment',
                                            'riskAssessment'
                                        ]
                                    }, null, 2)
                                }
                            ]
                        };
                    case 'thinking://saved_sessions':
                        const listResult = await this.toolHandlers.handleListSessions({ limit: 50, sort_by: 'lastModified', sort_order: 'desc' });
                        return {
                            contents: [
                                {
                                    uri,
                                    mimeType: 'application/json',
                                    text: JSON.stringify({
                                        success: listResult.success,
                                        totalSessions: listResult.sessions?.length || 0,
                                        sessions: listResult.sessions || [],
                                        lastUpdated: Date.now(),
                                        error: listResult.error
                                    }, null, 2)
                                }
                            ]
                        };
                    case 'thinking://session_history':
                        const historyResult = await this.toolHandlers.handleListSessions({
                            limit: 100,
                            sort_by: 'createdAt',
                            sort_order: 'desc'
                        });
                        const sessions = historyResult.sessions || [];
                        const trends = {
                            totalSessions: sessions.length,
                            strategiesUsed: [...new Set(sessions.map((s) => s.strategy))],
                            averageSteps: sessions.length > 0 ? sessions.reduce((sum, s) => sum + s.totalSteps, 0) / sessions.length : 0,
                            statusDistribution: sessions.reduce((acc, s) => {
                                acc[s.status] = (acc[s.status] || 0) + 1;
                                return acc;
                            }, {}),
                            recentActivity: sessions.slice(0, 10).map((s) => ({
                                id: s.id,
                                problemSummary: s.problemSummary,
                                strategy: s.strategy,
                                status: s.status,
                                lastModified: s.lastModified
                            }))
                        };
                        return {
                            contents: [
                                {
                                    uri,
                                    mimeType: 'application/json',
                                    text: JSON.stringify({
                                        success: historyResult.success,
                                        trends,
                                        lastUpdated: Date.now(),
                                        error: historyResult.error
                                    }, null, 2)
                                }
                            ]
                        };
                    case 'thinking://session_stats':
                        const statsResult = await this.toolHandlers.handleGetStorageStats();
                        return {
                            contents: [
                                {
                                    uri,
                                    mimeType: 'application/json',
                                    text: JSON.stringify({
                                        success: statsResult.success,
                                        stats: statsResult.stats,
                                        timestamp: Date.now(),
                                        error: statsResult.error
                                    }, null, 2)
                                }
                            ]
                        };
                    case 'thinking://session_events':
                        const eventsData = this.toolHandlers.getChainManager().getSessionEventHistory({ limit: 50 });
                        return {
                            contents: [
                                {
                                    uri,
                                    mimeType: 'application/json',
                                    text: JSON.stringify({
                                        success: true,
                                        events: eventsData,
                                        total_events: eventsData.length,
                                        timestamp: Date.now()
                                    }, null, 2)
                                }
                            ]
                        };
                    case 'thinking://event_metrics':
                        const eventMetrics = this.toolHandlers.getChainManager().getEventMetrics();
                        return {
                            contents: [
                                {
                                    uri,
                                    mimeType: 'application/json',
                                    text: JSON.stringify({
                                        success: true,
                                        metrics: eventMetrics,
                                        timestamp: Date.now()
                                    }, null, 2)
                                }
                            ]
                        };
                    case 'thinking://restoration_status':
                        const restorationMetrics = this.toolHandlers.getChainManager().getRestorationMetrics();
                        return {
                            contents: [
                                {
                                    uri,
                                    mimeType: 'application/json',
                                    text: JSON.stringify({
                                        success: true,
                                        restoration_metrics: restorationMetrics,
                                        timestamp: Date.now()
                                    }, null, 2)
                                }
                            ]
                        };
                    case 'thinking://recovery_status':
                        const recoveryStats = this.toolHandlers.getChainManager().getRecoveryStats();
                        return {
                            contents: [
                                {
                                    uri,
                                    mimeType: 'application/json',
                                    text: JSON.stringify({
                                        success: true,
                                        recovery_stats: recoveryStats,
                                        timestamp: Date.now()
                                    }, null, 2)
                                }
                            ]
                        };
                    case 'thinking://conflict_status':
                        const conflictStats = this.toolHandlers.getChainManager().getConflictStats();
                        const activeConflicts = this.toolHandlers.getChainManager().getActiveConflicts();
                        return {
                            contents: [
                                {
                                    uri,
                                    mimeType: 'application/json',
                                    text: JSON.stringify({
                                        success: true,
                                        conflict_stats: conflictStats,
                                        active_conflicts: activeConflicts,
                                        total_active: activeConflicts.length,
                                        timestamp: Date.now()
                                    }, null, 2)
                                }
                            ]
                        };
                    case 'thinking://conflict_history':
                        const conflictHistory = this.toolHandlers.getChainManager().getConflictHistory(50);
                        const historicalStats = this.toolHandlers.getChainManager().getConflictStats();
                        return {
                            contents: [
                                {
                                    uri,
                                    mimeType: 'application/json',
                                    text: JSON.stringify({
                                        success: true,
                                        conflict_history: conflictHistory,
                                        historical_stats: historicalStats,
                                        resolution_trends: {
                                            totalResolved: historicalStats.resolvedConflicts,
                                            successRate: historicalStats.resolutionSuccessRate,
                                            averageTime: historicalStats.averageResolutionTime,
                                            recentActivity: conflictHistory.slice(0, 10)
                                        },
                                        timestamp: Date.now()
                                    }, null, 2)
                                }
                            ]
                        };
                    default:
                        throw new Error(`Unknown resource: ${uri}`);
                }
            }
            catch (error) {
                this.logger.error(`Error reading resource ${uri}:`, error);
                throw error;
            }
        });
        // Prompt handlers
        this.server.setRequestHandler(ListPromptsRequestSchema, async () => ({
            prompts: this.prompts || []
        }));
        this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            try {
                switch (name) {
                    case 'analyze_problem_structure':
                        const problemDescription = args?.problem_description;
                        const includePatterns = Boolean(args?.include_patterns);
                        if (!problemDescription) {
                            throw new Error('problem_description is required');
                        }
                        let promptText = `Analyze the following problem structure and identify key components:\n\n${problemDescription}\n\n`;
                        promptText += `Please provide:\n1. Problem classification and domain\n2. Key constraints and requirements\n3. Success criteria and goal state\n4. Complexity assessment\n`;
                        if (includePatterns) {
                            promptText += `5. Matching cognitive patterns and recommended strategies\n`;
                        }
                        return {
                            messages: [
                                {
                                    role: 'user',
                                    content: {
                                        type: 'text',
                                        text: promptText
                                    }
                                }
                            ]
                        };
                    case 'generate_solution_strategy':
                        const problemContext = args?.problem_context;
                        const strategyPreference = args?.strategy_preference;
                        if (!problemContext) {
                            throw new Error('problem_context is required');
                        }
                        let strategyPrompt = `Based on the following problem context, generate a comprehensive solution strategy:\n\n${problemContext}\n\n`;
                        strategyPrompt += `Consider:\n1. Optimal decomposition approach\n2. Resource requirements and constraints\n3. Risk factors and mitigation strategies\n4. Success metrics and validation methods\n`;
                        if (strategyPreference) {
                            strategyPrompt += `\nPreferred strategy: ${strategyPreference}\n`;
                        }
                        return {
                            messages: [
                                {
                                    role: 'user',
                                    content: {
                                        type: 'text',
                                        text: strategyPrompt
                                    }
                                }
                            ]
                        };
                    case 'validate_reasoning_chain':
                        const reasoningState = args?.reasoning_state;
                        if (!reasoningState) {
                            throw new Error('reasoning_state is required');
                        }
                        const validationPrompt = `Please validate the following reasoning chain for quality and feasibility:\n\n${reasoningState}\n\n`;
                        const validationCriteria = `Evaluation criteria:\n1. Logical consistency and flow\n2. Step feasibility and clarity\n3. Dependency correctness\n4. Goal alignment\n5. Overall solution quality\n\nProvide specific feedback and improvement recommendations.`;
                        return {
                            messages: [
                                {
                                    role: 'user',
                                    content: {
                                        type: 'text',
                                        text: validationPrompt + validationCriteria
                                    }
                                }
                            ]
                        };
                    case 'analyze_session_patterns':
                        const sessionIds = Array.isArray(args?.session_ids) ? args.session_ids : undefined;
                        const focusArea = args?.focus_area;
                        let patternsPrompt = 'Analyze patterns and trends across reasoning sessions.\n\n';
                        if (sessionIds && sessionIds.length > 0) {
                            patternsPrompt += `Focus on these specific sessions: ${sessionIds.join(', ')}\n\n`;
                        }
                        else {
                            patternsPrompt += 'Analyze across all available sessions.\n\n';
                        }
                        patternsPrompt += 'Please provide analysis on:\n';
                        patternsPrompt += '1. Most effective decomposition strategies\n';
                        patternsPrompt += '2. Common problem patterns and solution approaches\n';
                        patternsPrompt += '3. Success rates and failure patterns\n';
                        patternsPrompt += '4. Performance trends over time\n';
                        patternsPrompt += '5. Recommendations for strategy selection\n';
                        if (focusArea) {
                            patternsPrompt += `\nSpecial focus on: ${focusArea}\n`;
                        }
                        return {
                            messages: [
                                {
                                    role: 'user',
                                    content: {
                                        type: 'text',
                                        text: patternsPrompt
                                    }
                                }
                            ]
                        };
                    case 'compare_sessions':
                        const sessionAId = args?.session_a_id;
                        const sessionBId = args?.session_b_id;
                        const comparisonAspects = args?.comparison_aspects;
                        if (!sessionAId || !sessionBId) {
                            throw new Error('Both session_a_id and session_b_id are required');
                        }
                        let comparePrompt = `Compare the reasoning approaches and outcomes between two sessions:\n\n`;
                        comparePrompt += `Session A ID: ${sessionAId}\n`;
                        comparePrompt += `Session B ID: ${sessionBId}\n\n`;
                        comparePrompt += 'Provide detailed comparison on:\n';
                        comparePrompt += '1. Problem-solving strategies used\n';
                        comparePrompt += '2. Step-by-step approach and reasoning quality\n';
                        comparePrompt += '3. Efficiency metrics (time, steps, resources)\n';
                        comparePrompt += '4. Success rates and outcome quality\n';
                        comparePrompt += '5. Key differences and lessons learned\n';
                        comparePrompt += '6. Recommendations for future similar problems\n';
                        if (comparisonAspects) {
                            comparePrompt += `\nFocus particularly on: ${comparisonAspects}\n`;
                        }
                        return {
                            messages: [
                                {
                                    role: 'user',
                                    content: {
                                        type: 'text',
                                        text: comparePrompt
                                    }
                                }
                            ]
                        };
                    default:
                        throw new Error(`Unknown prompt: ${name}`);
                }
            }
            catch (error) {
                this.logger.error(`Error handling prompt ${name}:`, error);
                throw error;
            }
        });
        this.logger.info('MCP handlers configured successfully');
    }
}
// Start server if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const server = new SequentialThinkingServer();
    server.start().catch(console.error);
}
export { SequentialThinkingServer };
//# sourceMappingURL=index.js.map