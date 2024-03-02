import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./App.css";
import { WagmiProvider, createConfig, http } from "wagmi";
import { bscTestnet } from "wagmi/chains";
import { createWeb3Modal } from "@web3modal/wagmi/react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Teachings from "./teachings";
import Courses from "./courses";
import Course from "./course";
import Navbar from "./Navbar";

const gfChain = {
  id: 5600,
  network: "greenfield",
  rpcUrls: {
    default: {
      http: ["https://gnfd-testnet-fullnode-tendermint-us.bnbchain.org"],
    },
  },
  name: "Greenfield Testnet",
  nativeCurrency: {
    name: "tBNB",
    symbol: "tBNB",
    decimals: 18,
  },
};

const config = createConfig({
  chains: [bscTestnet, gfChain],
  transports: {
    [bscTestnet.id]: http(),
    [gfChain.id]: http(),
  },
});

const projectId = "YOUR_PROJECT_ID";

createWeb3Modal({
  wagmiConfig: config,
  projectId,
});

const queryClient = new QueryClient();

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <>
        <Navbar />
        <Courses />
      </>
    ),
  },
  {
    path: "/course/:id",
    element: (
      <>
        <Navbar />
        <Course />
      </>
    ),
  },
  {
    path: "/me",
    element: (
      <>
        <Navbar />
        <Teachings />
      </>
    ),
  },
]);

function App() {
  return (
    <>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
        </QueryClientProvider>
      </WagmiProvider>
    </>
  );
}

export default App;
