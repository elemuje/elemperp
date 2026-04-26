# ElemPerp DEX

A privacy-first perpetuals trading DEX built on Solana Devnet, powered by [Arcium MPC](https://arcium.com) for confidential computation.

## Features

- 🔐 **Privacy-first trading** — trade parameters encrypted via Arcium FHE/MPC
- ⚡ **Perpetual futures** — long/short with up to 100× leverage
- 📊 **Real-time order book** — live mark price and simulated depth
- 🏆 **Leaderboard** — on-chain rankings with optional privacy mode
- 🌐 **Solana Devnet** — no real funds at risk

## Tech Stack

- **React 19** + **TypeScript** + **Vite 7**
- **Tailwind CSS v3** + **shadcn/ui** components
- **Framer Motion** for animations
- **Solana web3.js** + **Phantom wallet** adapter
- **React Router v7**

## Getting Started

### Prerequisites

- Node.js ≥ 18
- [Phantom Wallet](https://phantom.app/) browser extension set to **Devnet**

### Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build for Production

```bash
npm run build
npm run preview   # local preview of dist/
```

## Deploy to Vercel

1. Push to GitHub
2. Import the repo at [vercel.com/new](https://vercel.com/new)
3. Framework: **Vite** (auto-detected)
4. Build command: `npm run build`
5. Output directory: `dist`
6. Click **Deploy** — `vercel.json` handles SPA routing automatically

## Project Structure

```
elemperp-dex/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── ui/             # shadcn/ui primitives
│   │   ├── Navbar.tsx
│   │   ├── NetworkModal.tsx
│   │   └── ArciumExecutionPanel.tsx
│   ├── contexts/
│   │   ├── WalletContext.tsx
│   │   ├── TradingContext.tsx
│   │   └── ToastContext.tsx
│   ├── hooks/
│   │   └── use-mobile.ts
│   ├── lib/
│   │   └── utils.ts
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── Trade.tsx
│   │   ├── Leaderboard.tsx
│   │   ├── Privacy.tsx
│   │   └── Docs.tsx
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
└── vercel.json
```

## License

MIT
