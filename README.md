# Mercury MCP

Simple MCP server that interfaces with the Mercury API, allowing you to talk to your Mercury banking data from any MCP client like Cursor or Claude Desktop.

I am adding more coverage of the Mercury API over time, let me know which tools you need or just open a PR.

## Installation

Make sure to go to your Mercury Settings to get a [Mercury API Key](https://mercury.com/settings/tokens).

### Installing via Smithery
[![smithery badge](https://smithery.ai/badge/@dragonkhoi/mercury-mcp)](https://smithery.ai/server/@dragonkhoi/mercury-mcp)
To install mercury-mcp for Claude Desktop automatically via [Smithery](https://smithery.ai/server/@dragonkhoi/mercury-mcp):

```bash
npx -y @smithery/cli install @dragonkhoi/mercury-mcp --client claude
```

To install mixpanel-mcp for Cursor, go to Settings -> Cursor Settings -> Features -> MCP Servers -> + Add

Select Type: command and paste the below, using the arguments `<API_KEY>` from Mercury

```
npx -y @smithery/cli@latest run @dragonkhoi/mercury-mcp --config "{\"mercury_api_key\":\"YOUR_MERCURY_API_KEY\",}"
```

### Clone and run locally

Clone this repo
Run `npm run build`
Paste this command into Cursor (or whatever MCP Client)
`node /ABSOLUTE/PATH/TO/mixpanel-mcp/build/index.js YOUR_SERVICE_ACCOUNT_USERNAME YOUR_SERVICE_ACCOUNT_PASSWORD YOUR_PROJECT_ID`

## Examples
Ask "What is my bank balance"
