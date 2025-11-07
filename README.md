# 🌌 Monchil — Web3 Playground on Monad Network

![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Wagmi](https://img.shields.io/badge/wagmi-1E1E1E?logo=ethereum&logoColor=white)
![Monad](https://img.shields.io/badge/Monad-Native%20Token%20%24MON-purple)
![License](https://img.shields.io/badge/license-MIT-green)

> 🧩 A fun, modular Web3 playground built on **Monad Network** — includes NFT minting, daily faucet, and mini-games!  
> Integrated with **Reown WalletConnect**, **Farcaster Miniapps SDK**, and powered by **Vite + React + TypeScript**.

---

## 🚀 Features

| Feature | Description |
|----------|--------------|
| 🪙 **Wallet Connect by Reown** | Seamless wallet connection using [Reown SDK](https://reown.com) |
| ⚡ **Monad Network Support** | Works with Monad Testnet (native token: `MON`) |
| 🎨 **NFT Mint Template** | Mint cute Monchil NFTs — integrated with Farcaster sharing |
| 💧 **Faucet Page** | Daily MON faucet with 24h cooldown and 3-day streak bonus |
| 🎮 **Mini Game (NS-SHAFT)** | A simple arcade game built in React Canvas |
| 🌐 **Web3 Hooks Ready** | Built using `wagmi` and EVM-compatible chains |
| 🧰 **Developer Friendly** | Vite + TypeScript + Tailwind setup for fast dev experience |

---

## 📂 Project Structure

```
monchil/
├── src/
│   ├── pages/
│   │   ├── MintNFT.tsx      # NFT minting template
│   │   ├── MyFaucet.tsx     # Faucet dApp
│   │   └── GamePage.tsx     # NS-SHAFT mini-game
│   ├── hooks/               # Custom wagmi hooks and ABI files
│   ├── components/          # Shared UI components
│   └── main.tsx             # App entry
├── public/                  # Static assets (images, icons)
├── package.json
└── vite.config.ts
```

---

## 🧭 Quick Start

Clone dan jalankan secara lokal dengan langkah berikut 👇

### 1️⃣ Clone Repo

```bash
git clone https://github.com/afteronesix/monchil.git
cd monchil
```

### 2️⃣ Install Dependencies

```bash
npm install
# atau
pnpm install
```

### 3️⃣ Jalankan di Dev Mode

```bash
npm run dev
```

> App akan tersedia di [http://localhost:5173](http://localhost:5173)

---

## 🔗 Web3 Setup

### 🪙 Supported Chain
- **Monad Testnet**
- Native token: `MON`

### 💼 Wallet Connection
- Uses **Reown WalletConnect**
- Supports browser wallets (Reown, MetaMask, Rabby, etc.)

### 🪞 Farcaster Integration
- Built-in sharing using `@farcaster/miniapp-sdk`
- Example: Mint an NFT → Auto share via Farcaster cast

---

## 🧱 Pages Overview

### 🎨 `/mint`
Mint your **Monchil NFT** (Happy or Sad Mon)  
- Connect wallet → switch to Monad → mint  
- Share minted NFT on Farcaster

### 💧 `/faucet`
Daily claim faucet for **MON test tokens**  
- Claim every 24 hours  
- 3-day streak = bonus reward 🎁

### 🎮 `/game`
Play the **NS-SHAFT** game!  
- Use ← → or tap to move  
- Avoid spikes & stay alive  

---

## 🛠️ Development

| Command | Description |
|----------|--------------|
| `npm run dev` | Start dev server |
| `npm run build` | Build production version |
| `npm run preview` | Preview production build |

---

## 🤝 Contributing

Contributions are **welcome & appreciated**! 🙌  
Here’s how you can help:

1. **Fork** the repo  
2. Create a new branch  
   ```bash
   git checkout -b feature/awesome-update
   ```
3. Make your changes & commit  
   ```bash
   git commit -m "Add: awesome feature"
   ```
4. **Push** the branch  
   ```bash
   git push origin feature/awesome-update
   ```
5. Open a **Pull Request**

---

## 💜 Credits

Made with ☕ + ❤️ by [@afteronesix](https://github.com/afteronesix)  
Built for the **Monad** ecosystem — experiment, build, and have fun!

---

## 📜 License

This project is licensed under the **MIT License** — free to use and modify.

---

### 🧩 Links

- 🌐 Website: [monchil.vercel.app](https://monchil.vercel.app)
- 💾 Repo: [github.com/afteronesix/monchil](https://github.com/afteronesix/monchil)
- 🧠 Monad Docs: [docs.monad.xyz](https://docs.monad.xyz)
- 🪩 Reown SDK: [reown.com](https://reown.com)
