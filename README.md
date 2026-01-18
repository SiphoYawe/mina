<p align="center">
  <img src="mina-logo.svg" alt="Mina" width="400" />
</p>

<p align="center">
  <strong>Bridge & Trade on Hyperliquid — One Platform, Endless Possibilities</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#sdk">SDK</a> •
  <a href="#cli">CLI</a> •
  <a href="#trading">Trading</a> •
  <a href="#tech-stack">Tech Stack</a>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@siphoyawe/mina-sdk">
    <img src="https://img.shields.io/npm/v/@siphoyawe/mina-sdk?style=flat-square&color=blue" alt="npm version" />
  </a>
  <a href="https://mina-169e3f09.mintlify.app/">
    <img src="https://img.shields.io/badge/docs-mintlify-blue?style=flat-square" alt="Documentation" />
  </a>
  <a href="https://github.com/SiphoYawe/mina/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="License" />
  </a>
</p>

---

## Overview

**Mina** is a unified platform for cross-chain bridging and trading on Hyperliquid. Named after the biblical Parable of the Minas—a story about wisely investing and multiplying entrusted currency—Mina enables users to seamlessly move their assets to Hyperliquid and put them to work through advanced trading strategies.

### What Mina Offers

| Component | Description |
|-----------|-------------|
| **Web App** | Consumer-facing bridge & trading interface with premium "Dark Luxe" design |
| **SDK** | TypeScript library (`@siphoyawe/mina-sdk`) for developers to integrate Hyperliquid onboarding |
| **CLI** | Terminal-based bridging tool for power users and automation |

### The Problem

Getting started on Hyperliquid is fragmented and frustrating:

- **Too Many Steps** — Users navigate multiple interfaces, bridges, and transactions
- **Confusing Routes** — Finding the optimal path requires expertise
- **Incomplete Journey** — Even after bridging to HyperEVM, users must manually deposit to their trading account
- **Limited Trading Access** — Advanced trading strategies require separate platforms

### The Solution

Mina provides a complete end-to-end solution:

1. **Bridge** from 40+ chains with one click
2. **Auto-deposit** directly to your Hyperliquid L1 trading account
3. **Trade** with pair trading, basket trades, and single-asset positions
4. **Manage** your portfolio with real-time P&L tracking

---

## Features

### Bridging Features

| Feature | Description |
|---------|-------------|
| **40+ Source Chains** | Bridge from Ethereum, Arbitrum, Base, Polygon, Optimism, and more |
| **One-Click Bridge** | Simple interface that handles complexity behind the scenes |
| **Auto-Deposit** | Automatically deposit bridged assets to your Hyperliquid L1 trading account |
| **Real-Time Progress** | Visual stepper showing: Approval → Swap → Bridge → Deposit |
| **Transparent Pricing** | See all fees, gas costs, and estimated time upfront |
| **Route Optimization** | Choose between Recommended, Fastest, or Cheapest routes |
| **Slippage Control** | Configurable slippage (0.1%, 0.5%, 1.0%, or custom) |
| **Price Impact Warnings** | Live calculation with severity levels (low, medium, high, very high) |
| **Balance Validation** | Proactive warnings before attempting a bridge |
| **Alternative Routes** | Compare up to 3 alternative routes before bridging |

### Trading Features (Powered by Pear Protocol)

| Feature | Description |
|---------|-------------|
| **Pair Trading** | Long one asset, short another — trade 30,000+ pairs |
| **Popular Pairs** | Quick access to BTC/ETH, SOL/ETH, BTC/SOL, DOGE/SHIB |
| **Basket Trading** | Multi-asset portfolio trades with weighted allocations |
| **Single-Asset Trades** | Simple long or short positions on any asset |
| **Leverage** | 1x to 50x leverage on all trades |
| **Positions Sidebar** | Real-time open positions with P&L tracking |
| **Risk Management** | Stop-loss and take-profit parameters |
| **TWAP Orders** | Time-weighted average price execution |
| **Order Types** | Market, limit, trigger, and ladder orders |

### User Experience

| Feature | Description |
|---------|-------------|
| **Dark Luxe Design** | Premium visual design optimized for trading |
| **PWA Support** | Install as a native app on mobile and desktop |
| **Offline Detection** | Graceful handling of network disconnections |
| **500+ Wallets** | Connect with any wallet via Reown AppKit |
| **Share Receipts** | Share transaction receipts via URL |
| **Transaction History** | Track all your bridge transactions |
| **Globe Visualization** | Interactive 3D globe showing bridge routes |
| **Confetti Celebration** | Satisfying success animations |

---

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8+

### Installation

```bash
# Clone the repository
git clone https://github.com/SiphoYawe/mina.git
cd mina

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

The web app will be available at `http://localhost:3000`.

---

## SDK

[![npm](https://img.shields.io/npm/v/@siphoyawe/mina-sdk)](https://www.npmjs.com/package/@siphoyawe/mina-sdk) [![Documentation](https://img.shields.io/badge/docs-mintlify-blue)](https://mina-169e3f09.mintlify.app/)

The **Mina SDK** powers all bridging functionality across the web app and CLI. It provides a clean, type-safe API for integrating Hyperliquid onboarding into any application.

### Installation

```bash
npm install @siphoyawe/mina-sdk
# or
pnpm add @siphoyawe/mina-sdk
```

### Basic Usage

```typescript
import { Mina } from '@siphoyawe/mina-sdk';

// Initialize the client
const mina = new Mina({
  integrator: 'my-app',
  autoDeposit: true,      // Auto-deposit to Hyperliquid L1
  defaultSlippage: 0.005, // 0.5%
});

// Get a bridge quote
const quote = await mina.getQuote({
  fromChainId: 42161,     // Arbitrum
  toChainId: 999,         // HyperEVM
  fromToken: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // USDC
  toToken: '0xb88339cb7199b77e23db6e890353e22632ba630f',
  fromAmount: '1000000000', // 1000 USDC
  fromAddress: '0x...',
});

// Execute the bridge
const result = await mina.execute({
  quote,
  signer: walletClient,
  onStepUpdate: (step, status) => {
    console.log(`${step.type}: ${status.status}`);
  },
});
```

### React Hooks

```tsx
import { MinaProvider, useMina, useQuote } from '@siphoyawe/mina-sdk/react';

function App() {
  return (
    <MinaProvider config={{ integrator: 'my-app', autoDeposit: true }}>
      <BridgeForm />
    </MinaProvider>
  );
}

function BridgeForm() {
  const { mina } = useMina();
  const { quote, isLoading } = useQuote({
    fromChain: 42161,
    toChain: 999,
    fromToken: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    toToken: '0xb88339cb7199b77e23db6e890353e22632ba630f',
    amount: '1000000000',
    fromAddress: walletAddress,
  });
  // ...
}
```

### SDK API Reference

| Method | Description |
|--------|-------------|
| `new Mina(config)` | Initialize the Mina client |
| `mina.getChains()` | Get all 40+ supported source chains |
| `mina.getTokens(chainId)` | Get bridgeable tokens for a chain |
| `mina.getBalance(params)` | Get user token balance |
| `mina.getQuote(params)` | Fetch bridge quote with fees and ETA |
| `mina.execute(options)` | Execute bridge transaction |
| `mina.getStatus(txHash)` | Check transaction status |

### SDK Features

| Feature | Description |
|---------|-------------|
| **TypeScript Native** | Full type definitions with IntelliSense |
| **React Hooks** | `useQuote`, `useTokenBalance`, `useTransactionStatus` |
| **Smart Caching** | Built-in caching for chains, tokens, quotes, balances |
| **Error Recovery** | 11+ typed error classes with recovery suggestions |
| **Event System** | Subscribe to execution events for real-time updates |
| **Auto-Deposit** | Automatic deposit to Hyperliquid L1 trading account |

📚 **[Full SDK Documentation →](https://mina-169e3f09.mintlify.app/)**

---

## CLI

The **Mina CLI** provides terminal-based bridging for power users and automation workflows.

### Installation

```bash
# Install globally
npm install -g @siphoyawe/mina-cli

# Or run with npx
npx @siphoyawe/mina-cli
```

### Commands

#### Interactive Wizard

```bash
mina
# or
mina wizard
```

Step-by-step guided bridge experience with chain/token selection.

#### Get Quote

```bash
mina quote --from arbitrum --token USDC --amount 1000 [--json]
```

Preview fees, estimated time, and price impact without executing.

#### Execute Bridge

```bash
mina bridge --from arbitrum --token USDC --amount 1000 \
  [--key ./wallet.json] [--yes] [--auto-deposit]
```

Execute a bridge transaction with optional auto-confirmation.

#### Check Status

```bash
mina status <txHash> [--watch]
```

Monitor transaction progress with real-time updates.

#### List Chains

```bash
mina chains [--json]
```

Display all 40+ supported source chains.

#### List Tokens

```bash
mina tokens [--chain arbitrum] [--json]
```

Show bridgeable tokens for a specific chain.

#### Check Balance

```bash
mina balance --address 0x... [--chain arbitrum] [--all] [--json]
```

View wallet balances across one or all chains.

#### Transaction History

```bash
mina history [--limit 10] [--address 0x...]
```

View your bridge transaction history.

#### Configuration

```bash
mina config list
mina config get slippage
mina config set slippage 0.5
mina config set autoDeposit true
```

Manage persistent CLI settings.

### CLI Features

| Feature | Description |
|---------|-------------|
| **Beautiful TUI** | Ink-based terminal UI with dark luxe theme |
| **JSON Output** | Machine-readable output for scripting (`--json`) |
| **Interactive Selection** | Arrow-key navigation for chains and tokens |
| **Secure Key Input** | Hidden input for private key prompts |
| **Persistent Config** | Settings saved to `~/.mina/config.json` |
| **Auto-Retry** | Automatic retry on transient failures |

---

## Trading

Mina's trading features are powered by **[Pear Protocol](https://pear.garden/)**, enabling sophisticated trading strategies directly after bridging.

### Pair Trading

Trade the relative performance of two assets:
- **Long BTC / Short ETH** — Profit when BTC outperforms ETH
- **Long SOL / Short ETH** — Profit when SOL outperforms ETH
- **30,000+ Pairs** — Any combination of supported assets

### Basket Trading

Create diversified positions across multiple assets:
- Define custom allocations by weight
- Rebalance portfolios with a single transaction
- Track aggregate P&L

### Single-Asset Trading

Simple directional trades:
- Long or short any asset
- 1x to 50x leverage
- Stop-loss and take-profit orders

### Position Management

- **Real-time P&L** — Live profit/loss tracking
- **Margin Info** — Monitor margin usage
- **Close Positions** — One-click position closing
- **Adjust Positions** — Modify size, leverage, or risk parameters

---

## Technical Architecture

### System Overview

```
┌─────────────────┐     ┌─────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Source Chain   │────▶│   LI.FI     │────▶│    HyperEVM     │────▶│ Hyperliquid L1  │
│   (40+ chains)  │     │   Router    │     │   (Chain 999)   │     │   (Trading)     │
└─────────────────┘     └─────────────┘     └─────────────────┘     └─────────────────┘
```

### Monorepo Structure

```
mina/
├── apps/
│   └── web/              # Next.js web application
├── packages/
│   ├── sdk/              # @siphoyawe/mina-sdk
│   └── cli/              # @siphoyawe/mina-cli
└── docs/                 # Documentation
```

### Web App Architecture

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 14 (App Router) |
| **Styling** | Tailwind CSS + shadcn/ui |
| **Components** | Radix UI primitives |
| **Wallet** | Reown AppKit (500+ wallets) |
| **Web3** | Wagmi v2 + Viem |
| **State** | Zustand + TanStack Query |
| **Animations** | Framer Motion |

### SDK Architecture

| Layer | Technology |
|-------|------------|
| **Bridge Routing** | LI.FI SDK |
| **Deposit** | Hyperliquid API |
| **Caching** | Custom TTL caches |
| **Types** | Full TypeScript |
| **Build** | tsup |

### CLI Architecture

| Layer | Technology |
|-------|------------|
| **Framework** | Commander.js |
| **UI** | Ink (React for CLI) |
| **Styling** | Chalk |
| **Storage** | JSON file storage |

### Integrations

| Service | Purpose |
|---------|---------|
| **[LI.FI](https://li.fi/)** | Cross-chain route aggregation |
| **[Hyperliquid](https://hyperliquid.xyz/)** | L1 trading & deposits |
| **[Pear Protocol](https://pear.garden/)** | Pair & basket trading |
| **[Reown AppKit](https://reown.com/)** | Wallet connection |

---

## Supported Chains

### Source Chains (40+)

| Chain | Chain ID | Native Token |
|-------|----------|--------------|
| Ethereum | 1 | ETH |
| Arbitrum One | 42161 | ETH |
| Optimism | 10 | ETH |
| Base | 8453 | ETH |
| Polygon | 137 | MATIC |
| BNB Smart Chain | 56 | BNB |
| Avalanche | 43114 | AVAX |
| Fantom | 250 | FTM |
| zkSync Era | 324 | ETH |
| Linea | 59144 | ETH |
| Scroll | 534352 | ETH |
| Mantle | 5000 | MNT |
| Blast | 81457 | ETH |
| Mode | 34443 | ETH |
| Gnosis | 100 | xDAI |
| Moonbeam | 1284 | GLMR |
| Celo | 42220 | CELO |
| Aurora | 1313161554 | ETH |
| Metis | 1088 | METIS |
| And 20+ more... | | |

### Destination Chain

| Chain | Chain ID | Description |
|-------|----------|-------------|
| **HyperEVM** | 999 | Hyperliquid's EVM-compatible chain |
| **Hyperliquid L1** | — | Trading account (auto-deposit destination) |

---

## Feature Comparison

| Feature | Web App | SDK | CLI |
|---------|:-------:|:---:|:---:|
| Bridge from 40+ chains | ✓ | ✓ | ✓ |
| Auto-deposit to L1 | ✓ | ✓ | ✓ |
| Route optimization | ✓ | ✓ | ✓ |
| Slippage control | ✓ | ✓ | ✓ |
| Quote preview | ✓ | ✓ | ✓ |
| Fee breakdown | ✓ | ✓ | ✓ |
| Price impact warnings | ✓ | ✓ | ✓ |
| Pair trading | ✓ | — | — |
| Basket trading | ✓ | — | — |
| Position tracking | ✓ | — | — |
| Transaction history | ✓ | — | ✓ |
| Status monitoring | ✓ | ✓ | ✓ |
| Share receipts | ✓ | — | — |
| PWA support | ✓ | — | — |
| Interactive wizard | — | — | ✓ |
| JSON output | — | — | ✓ |
| Config management | — | — | ✓ |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Monorepo** | Turborepo + pnpm |
| **Framework** | Next.js 14 (App Router) |
| **Styling** | Tailwind CSS + shadcn/ui |
| **UI Components** | Radix UI primitives |
| **Wallet** | Reown AppKit (500+ wallets) |
| **Web3** | Wagmi v2 + Viem |
| **Bridging** | LI.FI SDK |
| **Trading** | Pear Protocol API |
| **State** | Zustand + TanStack Query |
| **Animations** | Framer Motion |
| **CLI Framework** | Commander.js + Ink |
| **SDK Build** | tsup |
| **Icons** | Lucide React |

---

## Links

- **SDK Documentation**: [mina-169e3f09.mintlify.app](https://mina-169e3f09.mintlify.app/)
- **NPM Package**: [@siphoyawe/mina-sdk](https://www.npmjs.com/package/@siphoyawe/mina-sdk)
- **Hyperliquid**: [hyperliquid.xyz](https://hyperliquid.xyz/)
- **LI.FI**: [li.fi](https://li.fi/)
- **Pear Protocol**: [pear.garden](https://pear.garden/)

---

## Hackathon Context

Built for the **Hyperliquid London Community Hackathon** (January 16-18, 2026) for the **LI.FI - One-Click Onboarding to Hyperliquid** track.

---

## License

MIT

---

<p align="center">
  <sub>Built with dedication for the Hyperliquid ecosystem</sub>
</p>
