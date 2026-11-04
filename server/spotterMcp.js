// Client for the ThoughtSpot Spotter MCP Server (options 5 and 6).
//
// The Spotter MCP Server is a hosted MCP endpoint. With bearer-token auth, every
// request carries the ThoughtSpot token plus the instance host. Spotter itself
// is the analytics agent; we just call its tools.

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

import { MCP_URL, TS_HOST } from './config.js';
import { getToken } from './thoughtspot.js';

let mcp = { client: null, token: null };

// One MCP connection, re-created whenever the ThoughtSpot token rotates.
async function getMcpClient() {
  const token = await getToken();
  if (mcp.client && mcp.token === token) return mcp.client;

  await mcp.client?.close().catch(() => {});
  const transport = new StreamableHTTPClientTransport(new URL(MCP_URL), {
    requestInit: {
      headers: {
        Authorization: `Bearer ${token}`,
        'x-ts-host': new URL(TS_HOST).host,
      },
    },
  });
  const client = new Client({ name: 'northpeak-mobile-backend', version: '1.0.0' });
  await client.connect(transport);
  console.log('MCP connected. Tools:', (await client.listTools()).tools.map((t) => t.name).join(', '));
  mcp = { client, token };
  return client;
}

// Calls a Spotter MCP tool and returns its JSON result.
export async function callSpotter(name, args) {
  const client = await getMcpClient();
  console.log(`→ MCP ${name}`, JSON.stringify(args));
  const result = await client.callTool({ name, arguments: args });
  if (result.isError) throw new Error(result.content?.[0]?.text ?? `${name} failed`);
  return result.structuredContent ?? JSON.parse(result.content[0].text);
}
