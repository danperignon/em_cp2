/**
 * Filesystem Integration
 * 
 * Provides reasoning artifact generation by integrating with the
 * EM_CP2 Filesystem server for creating concrete deliverables.
 */

import type { 
  ReasoningState,
  ReasoningStep,
  ProblemDefinition
} from '../types/index.js';
import { Logger } from '@em-cp2/shared';
import { join } from 'path';

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

export class FilesystemIntegration {
  private logger: Logger;
  private baseDirectory: string;
  private isAvailable: boolean = false;

  constructor(options: FilesystemIntegrationOptions = {}) {
    this.logger = new Logger('FilesystemIntegration');
    this.baseDirectory = options.baseDirectory || './reasoning-workspace';
    this.initializeFilesystemConnection();
  }

  /**
   * Initialize connection to Filesystem server
   */
  private async initializeFilesystemConnection(): Promise<void> {
    try {
      // Check if Filesystem server is available in the EM_CP2 ecosystem
      this.isAvailable = process.env.FILESYSTEM_INTEGRATION_ENABLED !== 'false';
      
      if (this.isAvailable) {
        this.logger.info('Filesystem integration initialized');
      } else {
        this.logger.info('Filesystem integration disabled - artifact generation unavailable');
      }
    } catch (error) {
      this.logger.warn('Filesystem server not available, artifact generation disabled');
      this.isAvailable = false;
    }
  }

  /**
   * Generate complete reasoning artifacts for a solution
   */
  async generateReasoningArtifacts(
    reasoningState: ReasoningState,
    options: FilesystemIntegrationOptions = {}
  ): Promise<ArtifactManifest> {
    if (!this.isAvailable) {
      this.logger.debug('Filesystem not available, skipping artifact generation');
      return this.createEmptyManifest(reasoningState.id);
    }

    try {
      const workspacePath = await this.createWorkspace(reasoningState);
      const artifacts: GeneratedArtifact[] = [];

      // Generate solution overview markdown
      if (options.generateMarkdown !== false) {
        const overviewArtifact = await this.generateSolutionOverview(reasoningState, workspacePath);
        artifacts.push(overviewArtifact);

        // Generate step-by-step guide
        const stepGuideArtifact = await this.generateStepByStepGuide(reasoningState, workspacePath);
        artifacts.push(stepGuideArtifact);
      }

      // Generate JSON export
      if (options.generateJSON !== false) {
        const jsonArtifact = await this.generateJSONExport(reasoningState, workspacePath);
        artifacts.push(jsonArtifact);
      }

      // Generate reusable template
      const templateArtifact = await this.generateReusableTemplate(reasoningState, workspacePath);
      artifacts.push(templateArtifact);

      // Generate individual step artifacts
      const stepArtifacts = await this.generateStepArtifacts(reasoningState, workspacePath);
      artifacts.push(...stepArtifacts);

      const manifest: ArtifactManifest = {
        reasoningStateId: reasoningState.id,
        workspacePath,
        artifacts,
        createdAt: Date.now(),
        totalFiles: artifacts.length
      };

      // Save manifest
      await this.saveManifest(manifest, workspacePath);

      this.logger.info(`Generated ${artifacts.length} reasoning artifacts in workspace: ${workspacePath}`);
      return manifest;

    } catch (error) {
      this.logger.error('Failed to generate reasoning artifacts:', error);
      return this.createEmptyManifest(reasoningState.id);
    }
  }

  /**
   * Create a dedicated workspace for the reasoning session
   */
  private async createWorkspace(reasoningState: ReasoningState): Promise<string> {
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const sessionId = reasoningState.id.split('-').pop()?.substring(0, 8) || 'unknown';
    const problemType = this.extractProblemType(reasoningState.problem);
    
    const workspaceName = `${timestamp}-${problemType}-${sessionId}`;
    const workspacePath = join(this.baseDirectory, workspaceName);

    // This would integrate with the Filesystem server to create directory
    await this.createDirectory(workspacePath);
    
    this.logger.debug(`Created workspace: ${workspacePath}`);
    return workspacePath;
  }

  /**
   * Generate solution overview markdown
   */
  private async generateSolutionOverview(
    reasoningState: ReasoningState,
    workspacePath: string
  ): Promise<GeneratedArtifact> {
    const filename = 'solution-overview.md';
    const filepath = join(workspacePath, filename);

    const content = this.buildSolutionOverviewContent(reasoningState);
    
    await this.writeFile(filepath, content);

    return {
      type: 'markdown',
      filename,
      path: filepath,
      description: 'Comprehensive solution overview with problem analysis and approach',
      size: content.length,
      createdAt: Date.now()
    };
  }

  /**
   * Generate step-by-step execution guide
   */
  private async generateStepByStepGuide(
    reasoningState: ReasoningState,
    workspacePath: string
  ): Promise<GeneratedArtifact> {
    const filename = 'step-by-step-guide.md';
    const filepath = join(workspacePath, filename);

    const content = this.buildStepByStepContent(reasoningState);
    
    await this.writeFile(filepath, content);

    return {
      type: 'markdown',
      filename,
      path: filepath,
      description: 'Detailed step-by-step execution guide with reasoning',
      size: content.length,
      createdAt: Date.now()
    };
  }

  /**
   * Generate JSON export of complete reasoning state
   */
  private async generateJSONExport(
    reasoningState: ReasoningState,
    workspacePath: string
  ): Promise<GeneratedArtifact> {
    const filename = 'reasoning-state.json';
    const filepath = join(workspacePath, filename);

    const content = JSON.stringify(reasoningState, null, 2);
    
    await this.writeFile(filepath, content);

    return {
      type: 'json',
      filename,
      path: filepath,
      description: 'Complete reasoning state data in JSON format',
      size: content.length,
      createdAt: Date.now()
    };
  }

  /**
   * Generate reusable template based on successful solution
   */
  private async generateReusableTemplate(
    reasoningState: ReasoningState,
    workspacePath: string
  ): Promise<GeneratedArtifact> {
    const filename = 'reusable-template.md';
    const filepath = join(workspacePath, filename);

    const content = this.buildTemplateContent(reasoningState);
    
    await this.writeFile(filepath, content);

    return {
      type: 'template',
      filename,
      path: filepath,
      description: 'Reusable template for similar problems',
      size: content.length,
      createdAt: Date.now()
    };
  }

  /**
   * Generate individual artifacts for each reasoning step
   */
  private async generateStepArtifacts(
    reasoningState: ReasoningState,
    workspacePath: string
  ): Promise<GeneratedArtifact[]> {
    const artifacts: GeneratedArtifact[] = [];
    const stepsDir = join(workspacePath, 'steps');
    
    await this.createDirectory(stepsDir);

    for (const step of reasoningState.steps) {
      const filename = `step-${step.index + 1}-${this.sanitizeFilename(step.description)}.md`;
      const filepath = join(stepsDir, filename);

      const content = this.buildStepContent(step, reasoningState);
      
      await this.writeFile(filepath, content);

      artifacts.push({
        type: 'markdown',
        filename,
        path: filepath,
        description: `Individual step artifact for: ${step.description}`,
        size: content.length,
        createdAt: Date.now()
      });
    }

    return artifacts;
  }

  // Content builders

  private buildSolutionOverviewContent(reasoningState: ReasoningState): string {
    const problem = reasoningState.problem;
    const strategy = reasoningState.strategy;
    
    return `# Solution Overview

## Problem Definition
**Description:** ${problem.description}

**Domain:** ${problem.domain}  
**Complexity:** ${problem.complexity}  
**Goal State:** ${problem.goalState}

## Constraints
${problem.constraints.length > 0 ? problem.constraints.map(c => `- ${c}`).join('\n') : '- None specified'}

## Solution Approach
**Strategy:** ${strategy.name} (${strategy.type})  
**Total Steps:** ${reasoningState.totalSteps}  
**Current Progress:** ${reasoningState.currentStep}/${reasoningState.totalSteps}

## Key Insights
- Problem decomposed using ${strategy.name} strategy
- Generated ${reasoningState.steps.length} actionable steps
- Average step confidence: ${(reasoningState.steps.reduce((sum, s) => sum + s.confidence, 0) / reasoningState.steps.length * 100).toFixed(1)}%

## Quick Start
1. Review the [step-by-step guide](./step-by-step-guide.md)
2. Check individual step details in the [steps/](./steps/) folder
3. Use the [reusable template](./reusable-template.md) for similar problems

---
*Generated by Sequential Thinking Server v2.0.0*  
*Timestamp: ${new Date(reasoningState.timestamp).toISOString()}*
`;
  }

  private buildStepByStepContent(reasoningState: ReasoningState): string {
    let content = `# Step-by-Step Execution Guide

## Problem: ${reasoningState.problem.description}

This guide provides detailed instructions for executing the solution step by step.

`;

    reasoningState.steps.forEach((step, index) => {
      content += `## Step ${index + 1}: ${step.description}

**Reasoning:** ${step.reasoning}  
**Confidence:** ${(step.confidence * 100).toFixed(1)}%  
**Status:** ${step.status}

`;

      if (step.dependencies.length > 0) {
        content += `**Dependencies:** This step depends on completing step(s): ${step.dependencies.map(dep => {
          const depStep = reasoningState.steps.find(s => s.id === dep);
          return depStep ? `${depStep.index + 1}` : 'unknown';
        }).join(', ')}

`;
      }

      if (Object.keys(step.inputs).length > 0) {
        content += `**Inputs:**
${Object.entries(step.inputs).map(([key, value]) => `- ${key}: ${value}`).join('\n')}

`;
      }

      if (Object.keys(step.outputs).length > 0) {
        content += `**Expected Outputs:**
${Object.entries(step.outputs).map(([key, value]) => `- ${key}: ${value}`).join('\n')}

`;
      }

      content += `---

`;
    });

    return content;
  }

  private buildTemplateContent(reasoningState: ReasoningState): string {
    const problem = reasoningState.problem;
    
    return `# Problem-Solving Template

## Template Type: ${problem.domain} - ${reasoningState.strategy.name}

This template is based on a successful solution and can be adapted for similar problems.

## When to Use This Template
- **Problem Domain:** ${problem.domain}
- **Complexity Level:** ${problem.complexity}
- **Problem Type:** Contains keywords like: [add relevant keywords]
- **Constraints:** Similar to: ${problem.constraints.join(', ') || 'none specified'}

## Template Steps

${reasoningState.steps.map((step, index) => `### ${index + 1}. [Adapt]: ${step.description}
- **Reasoning Pattern:** ${step.reasoning}
- **Key Considerations:** [customize based on specific problem]
- **Success Criteria:** [define specific success metrics]
`).join('\n')}

## Adaptation Guidelines
1. Replace bracketed placeholders with problem-specific details
2. Adjust reasoning depth based on problem complexity
3. Modify constraints based on your specific situation
4. Update success criteria to match your goals

## Success Metrics
- **Original Success Rate:** ${(reasoningState.steps.reduce((sum, s) => sum + s.confidence, 0) / reasoningState.steps.length * 100).toFixed(1)}%
- **Recommended Use Cases:** ${problem.domain} problems with ${problem.complexity} complexity
- **Strategy Effectiveness:** ${reasoningState.strategy.name} worked well for this problem type

---
*Template generated from successful solution*  
*Original solution date: ${new Date(reasoningState.timestamp).toISOString()}*
`;
  }

  private buildStepContent(step: ReasoningStep, reasoningState: ReasoningState): string {
    return `# Step ${step.index + 1}: ${step.description}

## Overview
**Status:** ${step.status}  
**Confidence:** ${(step.confidence * 100).toFixed(1)}%  
**Estimated Duration:** ${step.inputs?.estimatedDuration ? Math.round(Number(step.inputs.estimatedDuration) / 1000 / 60) + ' minutes' : 'Not specified'}

## Reasoning
${step.reasoning}

## Dependencies
${step.dependencies.length > 0 ? 
  step.dependencies.map(dep => {
    const depStep = reasoningState.steps.find(s => s.id === dep);
    return depStep ? `- Step ${depStep.index + 1}: ${depStep.description}` : `- Unknown step: ${dep}`;
  }).join('\n') : 
  'No dependencies'}

## Execution Details

### Inputs
${Object.keys(step.inputs).length > 0 ? 
  Object.entries(step.inputs).map(([key, value]) => `- **${key}:** ${value}`).join('\n') :
  'No specific inputs required'}

### Expected Outputs
${Object.keys(step.outputs).length > 0 ? 
  Object.entries(step.outputs).map(([key, value]) => `- **${key}:** ${value}`).join('\n') :
  'Outputs will be determined during execution'}

### Success Criteria
- [ ] Step completed successfully
- [ ] All outputs generated
- [ ] Quality meets confidence threshold (${(step.confidence * 100).toFixed(1)}%)
- [ ] No blocking errors encountered

${step.errors && step.errors.length > 0 ? `
## Issues Encountered
${step.errors.map(error => `- ${error}`).join('\n')}
` : ''}

---
*Generated by Sequential Thinking Server*  
*Step ID: ${step.id}*
`;
  }

  // Filesystem operations (would integrate with actual Filesystem server)

  private async createDirectory(path: string): Promise<void> {
    // This would integrate with the Filesystem server MCP interface
    this.logger.debug(`Creating directory: ${path}`);
  }

  private async writeFile(filepath: string, content: string): Promise<void> {
    // This would integrate with the Filesystem server MCP interface
    this.logger.debug(`Writing file: ${filepath} (${content.length} bytes)`);
  }

  private async saveManifest(manifest: ArtifactManifest, workspacePath: string): Promise<void> {
    const manifestPath = join(workspacePath, 'manifest.json');
    const content = JSON.stringify(manifest, null, 2);
    await this.writeFile(manifestPath, content);
  }

  // Helper methods

  private extractProblemType(problem: ProblemDefinition): string {
    const description = problem.description.toLowerCase();
    
    if (description.includes('analyze')) return 'analysis';
    if (description.includes('create') || description.includes('build')) return 'creation';
    if (description.includes('fix') || description.includes('debug')) return 'debugging';
    if (description.includes('plan')) return 'planning';
    if (description.includes('optimize')) return 'optimization';
    
    return 'general';
  }

  private sanitizeFilename(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
  }

  private createEmptyManifest(reasoningStateId: string): ArtifactManifest {
    return {
      reasoningStateId,
      workspacePath: '',
      artifacts: [],
      createdAt: Date.now(),
      totalFiles: 0
    };
  }

  /**
   * Check if Filesystem integration is available
   */
  isFilesystemAvailable(): boolean {
    return this.isAvailable;
  }

  /**
   * Get integration statistics
   */
  async getIntegrationStats(): Promise<{
    isAvailable: boolean;
    baseDirectory: string;
    totalWorkspaces: number;
    totalArtifacts: number;
  }> {
    return {
      isAvailable: this.isAvailable,
      baseDirectory: this.baseDirectory,
      totalWorkspaces: 0, // Would query actual counts
      totalArtifacts: 0
    };
  }
}