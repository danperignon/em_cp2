/**
 * Common utility functions
 */

export function detectClient(): 'claude-desktop' | 'cline' | 'unknown' {
  if (process.env.MCP_CLIENT === 'claude-desktop') return 'claude-desktop';
  if (process.env.MCP_CLIENT === 'cline') return 'cline';
  
  // Try to detect from process info
  const processArgs = process.argv.join(' ');
  if (processArgs.includes('claude')) return 'claude-desktop';
  if (processArgs.includes('cline')) return 'cline';
  
  return 'unknown';
}

export function isClaudeDesktop(): boolean {
  return detectClient() === 'claude-desktop';
}

export function isCline(): boolean {
  return detectClient() === 'cline';
}