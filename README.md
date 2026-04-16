# Vaultfire Explorer

Live on-chain dashboard for the **Vaultfire Protocol** — track AI agents, Partnership Bonds, Accountability Bonds, Street Cred scores, and belief-weighted governance across Base, Avalanche, Arbitrum, and Polygon.

## Features

- **Live Chain Status** — real-time agent counts, bond counts, and TVL from all 4 mainnet chains
- **Bond Activity** — browse all Partnership and Accountability bonds with stake amounts and status
- **Agent Lookup** — paste any address to see registration status, bonds, and Street Cred score across all chains
- **Belief-Weighted Governance** — industry-first governance where voting power = trust score, not token balance
- **Street Cred Scoring** — composite 0-95 trust score from on-chain identity, bonds, and reputation

## How It Works

Pure static site — no backend required. All data is fetched client-side directly from public RPC endpoints using ethers.js v6. The explorer reads from Vaultfire smart contracts deployed on:

| Chain | Chain ID | Contracts |
|-------|----------|-----------|
| Base | 8453 | Identity, Partnership, Accountability, Reputation, Bridge, VNS |
| Avalanche | 43114 | Identity, Partnership, Accountability, Reputation, Bridge |
| Arbitrum | 42161 | Identity, Partnership, Accountability, Reputation, Bridge, VNS |
| Polygon | 137 | Identity, Partnership, Accountability, Reputation, Bridge, VNS |

## Street Cred Scoring

| Component | Max Points |
|-----------|-----------|
| Identity Registered | 30 |
| Has Bond | 25 |
| Bond Active | 15 |
| Bond Tier Bonus | 20 |
| Multi-Chain Bonus | 5 |
| **Total** | **95** |

Tiers: None (0) · Bronze (1-30) · Silver (31-55) · Gold (56-75) · Platinum (76-95)

## Development

```bash
# Just open index.html in a browser — no build step needed
open index.html
```

## Vaultfire Ecosystem

| Package | Description |
|---|---|
| [`@vaultfire/agent-sdk`](https://github.com/Ghostkey316/vaultfire-sdk) | Core SDK — register agents, create bonds, query reputation |
| [`@vaultfire/langchain`](https://github.com/Ghostkey316/vaultfire-langchain) | LangChain / LangGraph integration |
| [`@vaultfire/a2a`](https://github.com/Ghostkey316/vaultfire-a2a) | Agent-to-Agent (A2A) protocol bridge |
| [`@vaultfire/enterprise`](https://github.com/Ghostkey316/vaultfire-enterprise) | Enterprise IAM bridge (Okta, Azure AD, OIDC) |
| [`@vaultfire/mcp-server`](https://github.com/Ghostkey316/vaultfire-mcp-server) | MCP server for Claude, Copilot, Cursor |
| [`@vaultfire/openai-agents`](https://github.com/Ghostkey316/vaultfire-openai-agents) | OpenAI Agents SDK integration |
| [`@vaultfire/vercel-ai`](https://github.com/Ghostkey316/vaultfire-vercel-ai) | Vercel AI SDK middleware and tools |
| [`@vaultfire/xmtp`](https://github.com/Ghostkey316/vaultfire-xmtp) | XMTP messaging with trust verification |
| [`@vaultfire/x402`](https://github.com/Ghostkey316/vaultfire-x402) | X402 payment protocol with trust gates |
| [`@vaultfire/vns`](https://github.com/Ghostkey316/vaultfire-vns) | Vaultfire Name Service — human-readable agent IDs |
| [`vaultfire-crewai`](https://github.com/Ghostkey316/vaultfire-crewai) | CrewAI integration (Python) |
| [`vaultfire-explorer`](https://github.com/Ghostkey316/vaultfire-explorer) | **This repo** — live on-chain explorer and governance dashboard |
| [`vaultfire-docs`](https://github.com/Ghostkey316/vaultfire-docs) | Developer portal — quickstart, playground, framework picker |

## License

MIT
