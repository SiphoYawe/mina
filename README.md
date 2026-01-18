<p align="center">
  <img src="mina-logo.svg" alt="Mina" width="400" />
</p>

<p align="center">
  <strong>Bridge & Trade on Hyperliquid — One Platform, Endless Possibilities</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#sdk">SDK</a> •
  <a href="#cli">CLI</a> •
  <a href="#trading">Trading</a> •
  <a href="#tech-stack">Tech Stack</a>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@siphoyawe/mina-sdk">
    <img src="https://img.shields.io/npm/v/@siphoyawe/mina-sdk?style=flat-square&color=blue" alt="npm version" />
  </a>
  <a href="https://docs.usemina.co/">
    <img src="https://img.shields.io/badge/docs-view%20docs-blue?style=flat-square" alt="Documentation" />
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
| **Web App** | Consumer-facing bridge & trading interface |
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
| **PWA Support** | Install as a native app on mobile and desktop |
| **Offline Detection** | Graceful handling of network disconnections |
| **500+ Wallets** | Connect with any wallet via Reown AppKit |
| **Transaction History** | Track all your bridge transactions |
| **Globe Visualization** | Interactive 3D globe showing bridge routes |

---

## SDK

[![npm](https://img.shields.io/npm/v/@siphoyawe/mina-sdk)](https://www.npmjs.com/package/@siphoyawe/mina-sdk)

The **Mina SDK** powers all bridging functionality across the web app and CLI. It provides a clean, type-safe API for integrating Hyperliquid onboarding into any application.

```bash
npm install @siphoyawe/mina-sdk
```

### Basic Usage

```typescript
import { Mina } from '@siphoyawe/mina-sdk';

const mina = new Mina({
  integrator: 'my-app',
  autoDeposit: true,
});

const quote = await mina.getQuote({
  fromChainId: 42161,     // Arbitrum
  toChainId: 999,         // HyperEVM
  fromToken: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
  toToken: '0xb88339cb7199b77e23db6e890353e22632ba630f',
  fromAmount: '1000000000',
  fromAddress: '0x...',
});

const result = await mina.execute({ quote, signer: walletClient });
```

### React Hooks

```tsx
import { MinaProvider, useQuote } from '@siphoyawe/mina-sdk/react';

function App() {
  return (
    <MinaProvider config={{ integrator: 'my-app', autoDeposit: true }}>
      <BridgeForm />
    </MinaProvider>
  );
}
```

### SDK Features

| Feature | Description |
|---------|-------------|
| **TypeScript Native** | Full type definitions with IntelliSense |
| **React Hooks** | `useQuote`, `useTokenBalance`, `useTransactionStatus` |
| **Smart Caching** | Built-in caching for chains, tokens, quotes, balances |
| **Error Recovery** | 11+ typed error classes with recovery suggestions |
| **Event System** | Subscribe to execution events for real-time updates |
| **Auto-Deposit** | Automatic deposit to Hyperliquid L1 trading account |

📦 **[View on NPM →](https://www.npmjs.com/package/@siphoyawe/mina-sdk)**

📚 **[Full SDK Documentation →](https://docs.usemina.co/)**

---

## CLI

[![npm](https://img.shields.io/npm/v/@siphoyawe/mina-cli)](https://www.npmjs.com/package/@siphoyawe/mina-cli)

The **Mina CLI** provides terminal-based bridging for power users and automation workflows.

```bash
npm install -g @siphoyawe/mina-cli
```

### Commands

| Command | Description |
|---------|-------------|
| `mina` | Interactive wizard for guided bridging |
| `mina quote` | Get bridge quote without executing |
| `mina bridge` | Execute bridge transaction |
| `mina status <txHash>` | Monitor transaction progress |
| `mina chains` | List all 40+ supported chains |
| `mina tokens` | List bridgeable tokens |
| `mina balance` | Check wallet balances |
| `mina history` | View transaction history |
| `mina config` | Manage CLI settings |

### CLI Features

| Feature | Description |
|---------|-------------|
| **Beautiful TUI** | Ink-based terminal UI |
| **JSON Output** | Machine-readable output for scripting (`--json`) |
| **Interactive Selection** | Arrow-key navigation for chains and tokens |
| **Secure Key Input** | Hidden input for private key prompts |
| **Persistent Config** | Settings saved to `~/.mina/config.json` |
| **Auto-Retry** | Automatic retry on transient failures |

📦 **[View on NPM →](https://www.npmjs.com/package/@siphoyawe/mina-cli)**

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

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 14 (App Router) |
| **Styling** | Tailwind CSS + shadcn/ui |
| **UI Components** | Radix UI primitives |
| **Wallet** | Reown AppKit (500+ wallets) |
| **Web3** | Wagmi v2 + Viem |
| **Bridging** | LI.FI SDK |
| **Trading** | Pear Protocol API |
| **State** | Zustand + TanStack Query |
| **Animations** | Framer Motion |
| **CLI** | Commander.js + Ink |

---

## Links

- **SDK Documentation**: [docs.usemina.co](https://docs.usemina.co/)
- **SDK on NPM**: [@siphoyawe/mina-sdk](https://www.npmjs.com/package/@siphoyawe/mina-sdk)
- **CLI on NPM**: [@siphoyawe/mina-cli](https://www.npmjs.com/package/@siphoyawe/mina-cli)
- **Hyperliquid**: [hyperliquid.xyz](https://hyperliquid.xyz/)
- **LI.FI**: [li.fi](https://li.fi/)
- **Pear Protocol**: [pear.garden](https://pear.garden/)

---

## License

MIT

---

<p align="center">
  <sub>Built with dedication for the Hyperliquid ecosystem</sub>
</p>
