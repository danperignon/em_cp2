/**
 * Session Lifecycle Event System
 *
 * Event-driven architecture for session state changes with configurable hooks,
 * monitoring capabilities, and lifecycle management integration.
 */
import { Logger } from '@em-cp2/shared';
export class SessionEventManager {
    logger;
    config;
    subscriptions;
    eventHistory;
    metrics;
    handlerStats;
    constructor(config = {}) {
        this.logger = new Logger('SessionEventManager');
        this.config = {
            enableEventHistory: true,
            maxHistorySize: 1000,
            enableMetrics: true,
            enableAsyncHandlers: true,
            handlerTimeoutMs: 5000,
            retryFailedHandlers: true,
            maxRetries: 3,
            ...config
        };
        this.subscriptions = new Map();
        this.eventHistory = [];
        this.handlerStats = new Map();
        this.metrics = {
            totalEvents: 0,
            eventsByType: new Map(),
            handlerExecutions: 0,
            handlerFailures: 0,
            averageHandlerTime: 0,
            lastEventTime: 0
        };
        this.initializeBuiltinHandlers();
    }
    /**
     * Subscribe to session lifecycle events
     */
    subscribe(eventTypes, handler, options = {}) {
        const subscriptionId = options.id || this.generateId();
        const types = Array.isArray(eventTypes) ? eventTypes : [eventTypes];
        const subscription = {
            id: subscriptionId,
            eventTypes: types,
            handler,
            priority: options.priority || 50,
            enabled: true,
            filter: options.filter
        };
        this.subscriptions.set(subscriptionId, subscription);
        this.logger.info(`Subscribed ${subscriptionId} to events: ${types.join(', ')}`);
        return subscriptionId;
    }
    /**
     * Unsubscribe from events
     */
    unsubscribe(subscriptionId) {
        const success = this.subscriptions.delete(subscriptionId);
        if (success) {
            this.logger.info(`Unsubscribed ${subscriptionId}`);
            this.handlerStats.delete(subscriptionId);
        }
        return success;
    }
    /**
     * Enable or disable a subscription
     */
    setSubscriptionEnabled(subscriptionId, enabled) {
        const subscription = this.subscriptions.get(subscriptionId);
        if (subscription) {
            subscription.enabled = enabled;
            this.logger.info(`${enabled ? 'Enabled' : 'Disabled'} subscription ${subscriptionId}`);
            return true;
        }
        return false;
    }
    /**
     * Emit a session event
     */
    async emit(type, sessionId, data, options = {}) {
        const event = {
            id: this.generateId(),
            type,
            sessionId,
            timestamp: Date.now(),
            source: options.source || 'system',
            data,
            metadata: options.metadata
        };
        // Update metrics
        this.updateMetrics(event);
        // Add to history
        if (this.config.enableEventHistory && !options.skipHistory) {
            this.addToHistory(event);
        }
        this.logger.debug(`Emitting event: ${type} for session ${sessionId}`);
        // Get applicable subscriptions
        const applicableSubscriptions = Array.from(this.subscriptions.values())
            .filter(sub => sub.enabled &&
            sub.eventTypes.includes(type) &&
            (!sub.filter || sub.filter(event)))
            .sort((a, b) => b.priority - a.priority); // Higher priority first
        // Execute handlers
        for (const subscription of applicableSubscriptions) {
            await this.executeHandler(subscription, event);
        }
    }
    /**
     * Get event history with optional filtering
     */
    getEventHistory(filter) {
        let filtered = [...this.eventHistory];
        if (filter) {
            if (filter.sessionId) {
                filtered = filtered.filter(e => e.sessionId === filter.sessionId);
            }
            if (filter.eventType) {
                filtered = filtered.filter(e => e.type === filter.eventType);
            }
            if (filter.startTime) {
                filtered = filtered.filter(e => e.timestamp >= filter.startTime);
            }
            if (filter.endTime) {
                filtered = filtered.filter(e => e.timestamp <= filter.endTime);
            }
            if (filter.limit) {
                filtered = filtered.slice(-filter.limit);
            }
        }
        return filtered.sort((a, b) => b.timestamp - a.timestamp);
    }
    /**
     * Get event metrics and statistics
     */
    getMetrics() {
        const handlerStats = Array.from(this.handlerStats.entries()).map(([id, stats]) => ({
            subscriptionId: id,
            executions: stats.executions,
            failures: stats.failures,
            averageTime: stats.executions > 0 ? stats.totalTime / stats.executions : 0,
            successRate: stats.executions > 0 ? (stats.executions - stats.failures) / stats.executions : 0
        }));
        const eventDistribution = Array.from(this.metrics.eventsByType.entries())
            .map(([eventType, count]) => ({
            eventType,
            count,
            percentage: this.metrics.totalEvents > 0 ? (count / this.metrics.totalEvents) * 100 : 0
        }))
            .sort((a, b) => b.count - a.count);
        return {
            overview: { ...this.metrics },
            handlerStats,
            eventDistribution
        };
    }
    /**
     * Clear event history
     */
    clearHistory() {
        this.eventHistory = [];
        this.logger.info('Event history cleared');
    }
    /**
     * Get all active subscriptions
     */
    getSubscriptions() {
        return Array.from(this.subscriptions.values()).map(sub => ({
            id: sub.id,
            eventTypes: [...sub.eventTypes],
            priority: sub.priority,
            enabled: sub.enabled,
            hasFilter: !!sub.filter
        }));
    }
    // Private methods
    initializeBuiltinHandlers() {
        // Session lifecycle logging
        this.subscribe(['session_created', 'session_completed', 'session_failed'], this.handleSessionLifecycleLogging.bind(this), { id: 'builtin-lifecycle-logger', priority: 100 });
        // Health monitoring
        this.subscribe(['health_check_failed', 'validation_warning'], this.handleHealthMonitoring.bind(this), { id: 'builtin-health-monitor', priority: 90 });
        // Recovery tracking
        this.subscribe(['recovery_started', 'recovery_completed', 'recovery_failed'], this.handleRecoveryTracking.bind(this), { id: 'builtin-recovery-tracker', priority: 80 });
    }
    async handleSessionLifecycleLogging(event) {
        const { type, sessionId, data } = event;
        switch (type) {
            case 'session_created':
                this.logger.info(`Session ${sessionId} created with ${data.currentState?.totalSteps || 0} steps`);
                break;
            case 'session_completed':
                this.logger.info(`Session ${sessionId} completed successfully`);
                break;
            case 'session_failed':
                this.logger.warn(`Session ${sessionId} failed: ${data.error || 'Unknown error'}`);
                break;
        }
    }
    async handleHealthMonitoring(event) {
        const { type, sessionId, data } = event;
        if (type === 'health_check_failed' && data.healthReport) {
            const { healthScore, issues } = data.healthReport;
            this.logger.warn(`Session ${sessionId} health check failed (score: ${healthScore}): ${issues.map(i => i.message).join(', ')}`);
        }
        if (type === 'validation_warning') {
            this.logger.warn(`Session ${sessionId} validation warning: ${data.reason || 'Unknown issue'}`);
        }
    }
    async handleRecoveryTracking(event) {
        const { type, sessionId, data } = event;
        switch (type) {
            case 'recovery_started':
                this.logger.info(`Starting recovery for session ${sessionId}`);
                break;
            case 'recovery_completed':
                if (data.recoveryResult) {
                    const { strategy, confidence, recoveryType } = data.recoveryResult;
                    this.logger.info(`Successfully recovered session ${sessionId} using ${strategy} (${recoveryType}, confidence: ${(confidence * 100).toFixed(1)}%)`);
                }
                break;
            case 'recovery_failed':
                this.logger.error(`Failed to recover session ${sessionId}: ${data.error || 'Unknown error'}`);
                break;
        }
    }
    async executeHandler(subscription, event) {
        const startTime = Date.now();
        const stats = this.handlerStats.get(subscription.id) || { executions: 0, failures: 0, totalTime: 0 };
        try {
            stats.executions++;
            if (this.config.enableAsyncHandlers) {
                const result = subscription.handler(event);
                if (result instanceof Promise) {
                    await this.executeWithTimeout(result, this.config.handlerTimeoutMs);
                }
            }
            else {
                subscription.handler(event);
            }
            const executionTime = Date.now() - startTime;
            stats.totalTime += executionTime;
            this.metrics.handlerExecutions++;
            this.metrics.averageHandlerTime =
                (this.metrics.averageHandlerTime * (this.metrics.handlerExecutions - 1) + executionTime) /
                    this.metrics.handlerExecutions;
        }
        catch (error) {
            stats.failures++;
            this.metrics.handlerFailures++;
            this.logger.warn(`Handler ${subscription.id} failed for event ${event.type}:`, error);
            // Retry logic
            if (this.config.retryFailedHandlers && stats.failures <= this.config.maxRetries) {
                this.logger.debug(`Retrying handler ${subscription.id} (attempt ${stats.failures}/${this.config.maxRetries})`);
                await this.sleep(1000 * stats.failures); // Exponential backoff
                await this.executeHandler(subscription, event);
            }
        }
        finally {
            this.handlerStats.set(subscription.id, stats);
        }
    }
    updateMetrics(event) {
        this.metrics.totalEvents++;
        this.metrics.lastEventTime = event.timestamp;
        const typeCount = this.metrics.eventsByType.get(event.type) || 0;
        this.metrics.eventsByType.set(event.type, typeCount + 1);
    }
    addToHistory(event) {
        this.eventHistory.push(event);
        // Maintain history size limit
        if (this.eventHistory.length > this.config.maxHistorySize) {
            this.eventHistory = this.eventHistory.slice(-this.config.maxHistorySize);
        }
    }
    generateId() {
        return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    async executeWithTimeout(promise, timeoutMs) {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error(`Handler execution timed out after ${timeoutMs}ms`));
            }, timeoutMs);
            promise
                .then(result => {
                clearTimeout(timeout);
                resolve(result);
            })
                .catch(error => {
                clearTimeout(timeout);
                reject(error);
            });
        });
    }
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
//# sourceMappingURL=session-events.js.map