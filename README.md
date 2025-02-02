# mcp-google-server A MCP Server for Google Custom Search
[![smithery badge](https://smithery.ai/badge/@adenot/mcp-google-search)](https://smithery.ai/server/@adenot/mcp-google-search)

A Model Context Protocol server that provides web search capabilities using Google Custom Search API.

<a href="https://glama.ai/mcp/servers/05vc0lafp9"><img width="380" height="200" src="https://glama.ai/mcp/servers/05vc0lafp9/badge" alt="Google Server MCP server" /></a>

## Setup

### Getting Google API Key and Search Engine ID

1. Create a Google Cloud Project:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable billing for your project

2. Enable Custom Search API:
   - Go to [API Library](https://console.cloud.google.com/apis/library)
   - Search for "Custom Search API"
   - Click "Enable"

3. Get API Key:
   - Go to [Credentials](https://console.cloud.google.com/apis/credentials)
   - Click "Create Credentials" > "API Key"
   - Copy your API key
   - (Optional) Restrict the API key to only Custom Search API

4. Create Custom Search Engine:
   - Go to [Programmable Search Engine](https://programmablesearchengine.google.com/create/new)
   - Enter the sites you want to search (use www.google.com for general web search)
   - Click "Create"
   - On the next page, click "Customize"
   - In the settings, enable "Search the entire web"
   - Copy your Search Engine ID (cx)

## Development

Install dependencies:
```bash
npm install
```

Build the server:
```bash
npm run build
```

For development with auto-rebuild:
```bash
npm run watch
```

## Installation

### Installing via Smithery

To install Google Custom Search Server for Claude Desktop automatically via [Smithery](https://smithery.ai/server/@adenot/mcp-google-search):

```bash
npx -y @smithery/cli install @adenot/mcp-google-search --client claude
```

To use with Claude Desktop, add the server config with your Google API credentials:

On MacOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
On Windows: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "google-search": {
      "command": "npx",
      "args": [
        "-y",
        "@adenot/mcp-google-search"
      ],
      "env": {
        "GOOGLE_API_KEY": "your-api-key-here",
        "GOOGLE_SEARCH_ENGINE_ID": "your-search-engine-id-here"
      }
    }
  }
}
```

### Debugging

Since MCP servers communicate over stdio, debugging can be challenging. We recommend using the [MCP Inspector](https://github.com/modelcontextprotocol/inspector), which is available as a package script:

```bash
npm run inspector
```

The Inspector will provide a URL to access debugging tools in your browser.
