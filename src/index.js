import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";

import "@rainbow-me/rainbowkit/styles.css";
import { getDefaultWallets, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { configureChains, createClient, WagmiConfig } from "wagmi";
import { optimism, arbitrum, polygon, goerli, mainnet } from "wagmi/chains";
import { alchemyProvider } from "wagmi/providers/alchemy";
import { publicProvider } from "wagmi/providers/public";

const myHardhatNetWork= {
   id: 1337,
   name: "Hardhat Network",
   nativeCurrency: {
       decimals: 18,
       name: "Ether",
       symbol: "ETH",
  },
   rpcUrls: {
       default: {
           http:  ["http://localhost:8545"],
      },
       testnet:true,
  }
}

const { chains, provider } = configureChains(
  [mainnet, optimism, arbitrum, polygon, goerli, myHardhatNetWork],
  [alchemyProvider({ apiKey: process.env.ALCHEMY_KEY }), publicProvider()]
);

const { connectors } = getDefaultWallets({
  appName: "EtherWallet Dapp",
  chains,
});

const wagmiClient = createClient({
  autoConnect: true,
  connectors,
  provider,
});

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <WagmiConfig client={wagmiClient}>
      <RainbowKitProvider chains={chains}>
        <App />
      </RainbowKitProvider>
    </WagmiConfig>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
