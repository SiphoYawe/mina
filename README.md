<p align="center">
  <img src="mina-logo.svg" alt="Mina" width="400" />
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#sdk">SDK</a> •
  <a href="#tech-stack">Tech Stack</a>
</p>

---

## Overview

**Mina** is a one-click cross-chain onboarding solution that enables users to bridge assets from any blockchain into the Hyperliquid ecosystem. Named after the biblical Parable of the Minas—a story about wisely investing and multiplying entrusted currency—Mina enables users to seamlessly move their assets to Hyperliquid where they can multiply through trading.

### The Problem

Bridging assets into Hyperliquid is fragmented and frustrating:

- **Too Many Steps** — Users navigate multiple interfaces, bridges, and transactions
- **Confusing Routes** — Finding the optimal path requires expertise
- **Incomplete Journey** — Even after bridging to HyperEVM, users must manually deposit to their trading account
- **Poor Transparency** — Hidden fees, unclear ETAs, and opaque execution create anxiety

### The Solution

Mina provides:

- **Mina Web App** — A polished, consumer-facing bridge interface with premium "Dark Luxe" design
- **Mina SDK** — A developer toolkit (`@mina-bridge/sdk`) for integrating Hyperliquid onboarding into any application

## Features

### Core Features

- **Multi-Chain Support** — Bridge from 40+ chains including Ethereum, Arbitrum, Base, Polygon, Solana
- **One-Click Bridge** — Simple interface that handles complexity behind the scenes
- **Auto-Deposit** — Automatically deposit bridged assets to your Hyperliquid L1 trading account
- **Real-Time Progress** — Visual stepper showing: Approval → Swap → Bridge → Deposit
- **Transparent Pricing** — See all fees, gas costs, and estimated time upfront

### Advanced Features

- **Slippage Tolerance** — Configurable slippage (0.1%, 0.5%, 1.0%, custom)
- **Route Preference** — Choose between Recommended, Fastest, or Cheapest routes
- **Price Impact Warnings** — Live calculation with warnings for high impact trades
- **Insufficient Balance Detection** — Proactive warnings before attempting a bridge

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

## SDK

The Mina SDK provides a clean API for integrating Hyperliquid onboarding into any application.

### Installation

```bash
npm install @mina-bridge/sdk
# or
pnpm add @mina-bridge/sdk
```

### Basic Usage

```typescript
import { Mina } from '@mina-bridge/sdk';

// Initialize the client
const mina = new Mina({
  apiKey: 'your-api-key', // optional
});

// Get a bridge quote
const quote = await mina.getQuote({
  fromChain: 42161, // Arbitrum
  toChain: 999,     // HyperEVM
  fromToken: 'USDC',
  toToken: 'USDC',
  amount: '1000000000', // 1000 USDC
  fromAddress: '0x...',
  autoDeposit: true, // Deposit to Hyperliquid L1
});

// Execute the bridge
const result = await mina.execute(quote, {
  signer, // ethers signer or viem wallet client
  onStepChange: (step) => console.log('Step:', step),
  onStatusChange: (status) => console.log('Status:', status),
});
```

### React Hooks

```tsx
import { MinaProvider, useMina, useQuote } from '@mina-bridge/sdk/react';

function App() {
  return (
    <MinaProvider>
      <BridgeForm />
    </MinaProvider>
  );
}

function BridgeForm() {
  const { execute } = useMina();
  const { data: quote, isLoading } = useQuote({
    fromChain: 42161,
    toChain: 999,
    fromToken: 'USDC',
    toToken: 'USDC',
    amount: '1000000000',
  });

  // ... rest of your component
}
```

### SDK API Reference

| Method | Description |
|--------|-------------|
| `new Mina(config)` | Initialize the Mina client |
| `mina.getQuote(params)` | Fetch a bridge quote |
| `mina.execute(quote, options)` | Execute a bridge transaction |
| `mina.getStatus(txHash)` | Check transaction status |
| `mina.getChains()` | Get supported origin chains |
| `mina.getTokens(chainId)` | Get tokens for a chain |
| `mina.getBalance(params)` | Get user token balance |

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Monorepo** | Turborepo + pnpm |
| **Framework** | Next.js 14 (App Router) |
| **Styling** | Tailwind CSS + shadcn/ui |
| **Wallet** | Reown AppKit (500+ wallets) |
| **Web3** | Wagmi v2 + Viem |
| **Bridging** | LI.FI SDK |
| **State** | Zustand + TanStack Query |
| **Animations** | Framer Motion |
| **SDK Build** | tsup |

## Hackathon Context

Built for the **Hyperliquid London Community Hackathon** (January 16-18, 2026) for the **LI.FI - One-Click Onboarding to Hyperliquid** track.

### Judging Criteria

- Creative use of LI.FI infrastructure
- User experience and design quality
- Technical implementation and reliability
- Fit within Hyperliquid ecosystem

## License

MIT

---

<p align="center">
  <sub>Built with dedication for the Hyperliquid ecosystem</sub>
</p>
