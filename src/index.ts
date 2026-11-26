#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createClient } from './client.js';
import { loadConfig } from './config.js';
import { registerTools } from './tools.js';

async function main(): Promise<void> {
  const config = loadConfig(process.env);
  const server = new McpServer({ name: 'xcbrasil', version: '0.1.0' });
  registerTools(server, createClient(config));
  await server.connect(new StdioServerTransport());
}

main().catch((error) => {
  process.stderr.write(`xcbrasil-mcp: ${(error as Error).message}\n`);
  process.exit(1);
});
