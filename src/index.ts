#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';
import * as cheerio from 'cheerio';

const API_KEY = process.env.GOOGLE_API_KEY;
const SEARCH_ENGINE_ID = process.env.GOOGLE_SEARCH_ENGINE_ID;

if (!API_KEY) {
  throw new Error('GOOGLE_API_KEY environment variable is required');
}

if (!SEARCH_ENGINE_ID) {
  throw new Error('GOOGLE_SEARCH_ENGINE_ID environment variable is required');
}

interface SearchResult {
  title: string;
  link: string;
  snippet: string;
}

interface WebpageContent {
  title: string;
  text: string;
  url: string;
}

const isValidSearchArgs = (
  args: any
): args is { query: string; num?: number } =>
  typeof args === 'object' &&
  args !== null &&
  typeof args.query === 'string' &&
  (args.num === undefined || typeof args.num === 'number');

const isValidWebpageArgs = (
  args: any
): args is { url: string } =>
  typeof args === 'object' &&
  args !== null &&
  typeof args.url === 'string';

class SearchServer {
  private server: Server;
  private axiosInstance;

  constructor() {
    this.server = new Server(
      {
        name: 'search-server',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.axiosInstance = axios.create({
      baseURL: 'https://www.googleapis.com/customsearch/v1',
      params: {
        key: API_KEY,
        cx: SEARCH_ENGINE_ID,
      },
    });

    this.setupToolHandlers();
    
    // Error handling
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'search',
          description: 'Perform a web search query',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Search query',
              },
              num: {
                type: 'number',
                description: 'Number of results (1-10)',
                minimum: 1,
                maximum: 10,
              },
            },
            required: ['query'],
          },
        },
        {
          name: 'read_webpage',
          description: 'Fetch and extract text content from a webpage',
          inputSchema: {
            type: 'object',
            properties: {
              url: {
                type: 'string',
                description: 'URL of the webpage to read',
              },
            },
            required: ['url'],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      if (request.params.name === 'search') {
        if (!isValidSearchArgs(request.params.arguments)) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'Invalid search arguments'
          );
        }

        const { query, num = 5 } = request.params.arguments;

        try {
          const response = await this.axiosInstance.get('', {
            params: {
              q: query,
              num: Math.min(num, 10),
            },
          });

          const results: SearchResult[] = response.data.items.map((item: any) => ({
            title: item.title,
            link: item.link,
            snippet: item.snippet,
          }));

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(results, null, 2),
              },
            ],
          };
        } catch (error) {
          if (axios.isAxiosError(error)) {
            return {
              content: [
                {
                  type: 'text',
                  text: `Search API error: ${
                    error.response?.data?.error?.message ?? error.message
                  }`,
                },
              ],
              isError: true,
            };
          }
          throw error;
        }
      } else if (request.params.name === 'read_webpage') {
        if (!isValidWebpageArgs(request.params.arguments)) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'Invalid webpage arguments'
          );
        }

        const { url } = request.params.arguments;

        try {
          const response = await axios.get(url);
          const $ = cheerio.load(response.data);

          // Remove script and style elements
          $('script, style').remove();

          const content: WebpageContent = {
            title: $('title').text().trim(),
            text: $('body').text().trim().replace(/\s+/g, ' '),
            url: url,
          };

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(content, null, 2),
              },
            ],
          };
        } catch (error) {
          if (axios.isAxiosError(error)) {
            return {
              content: [
                {
                  type: 'text',
                  text: `Webpage fetch error: ${error.message}`,
                },
              ],
              isError: true,
            };
          }
          throw error;
        }
      }

      throw new McpError(
        ErrorCode.MethodNotFound,
        `Unknown tool: ${request.params.name}`
      );
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.log('Search MCP server running on stdio');
  }
}

const server = new SearchServer();
server.run().catch(console.error);
