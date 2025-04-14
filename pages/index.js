import { useEffect, useState } from "react";
import { ethers } from "ethers";
import Image from "next/image";

const contractABI = [
  {
    inputs: [],
    name: "claim",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "user",
        type: "address",
      },
    ],
    name: "Claimed",
    type: "event",
  },
];

const contractAddress = "0x854bab28e45bf6c06c9802c3f1eadf96bcb1a3eb";
const RPC = "https://tea-sepolia.g.alchemy.com/v2/0qiY9LelIcif8b0uECA5nFbWeTDvsU3t";

export default function ClickToTxDApp() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [walletAddress, setWalletAddress] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined" && typeof window.ethereum !== "undefined") {
      const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
      setProvider(web3Provider);
    }
  }, []);

  const connectWallet = async () => {
    try {
      if (!provider) return;

      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      setSigner(signer);
      setWalletAddress(address);

      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x27EA" }],
        });
      } catch (switchError) {
        if (switchError.code === 4902) {
          await addTeaSepoliaNetwork();
        } else {
          console.error("❌ Switch chain error:", switchError);
        }
      }
    } catch (err) {
      console.error("Wallet connection error:", err);
    }
  };

  const addTeaSepoliaNetwork = async () => {
    try {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: "0x27EA",
            chainName: "Tea Sepolia Testnet",
            nativeCurrency: {
              name: "TEA",
              symbol: "TEA",
              decimals: 18,
            },
            rpcUrls: [RPC],
            blockExplorerUrls: ["https://sepolia.tea.xyz/"],
          },
        ],
      });
    } catch (err) {
      console.error("❌ Add network error:", err);
    }
  };

  const handleClickTx = async () => {
    if (!signer) return;
    setIsLoading(true);
    try {
      const contract = new ethers.Contract(contractAddress, contractABI, signer);
      const tx = await contract.claim();
      await tx.wait();
      setTxHash(tx.hash);
    } catch (err) {
      console.error("❌ Transaction error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-gray-800 flex flex-col items-center justify-start px-6 pt-10 space-y-6">
      <HeroSection />

      <h1 className="text-4xl font-bold text-white drop-shadow-[0_0_10px_#00ffe0]">Tea Protocol DApp</h1>

      {walletAddress && (
        <p className="text-green-400 text-sm text-center break-all drop-shadow-[0_0_10px_#00ffe0]">
          Connected: {walletAddress}
        </p>
      )}

      {!walletAddress && (
        <button
          onClick={connectWallet}
          className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white px-8 py-4 rounded-2xl text-xl font-bold shadow-lg transition-all duration-300 transform hover:scale-105"
        >
          <span className="drop-shadow-[0_0_10px_#00ffe0]">Connect Wallet</span>
        </button>
      )}

      <div className="flex flex-col items-center justify-center mt-6 mb-12">
        {walletAddress && (
          <button
            onClick={handleClickTx}
            className="relative w-52 h-52 rounded-full overflow-hidden shadow-xl flex items-center justify-center hover:scale-105 transition-transform duration-300"
            disabled={isLoading}
          >
            <Image
              src="/Clickk.png"
              alt="Tea Click"
              fill
              className="object-cover"
            />
            <span className="absolute text-white font-extrabold text-3xl tracking-wider drop-shadow-[0_0_10px_#00ffe0]">
              {isLoading ? "..." : "Click"}
            </span>
          </button>
        )}

        {txHash && (
          <p className="mt-2 text-sm text-blue-300 drop-shadow-[0_0_10px_#00ffe0]">
            TX:{" "}
            <a
              href={`https://sepolia.tea.xyz/tx/${txHash}`}
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              {txHash}
            </a>
          </p>
        )}
      </div>

      <div className="fixed bottom-6 flex gap-4 justify-center">
        <button
          onClick={addTeaSepoliaNetwork}
          className="bg-yellow-400 text-black px-4 py-2 rounded-xl text-sm hover:bg-yellow-300"
        >
          Add Tea Sepolia
        </button>
        <a
          href="https://faucet-sepolia.tea.xyz/"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-purple-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-purple-500"
        >
          Get TEA
        </a>
      </div>
    </div>
  );
}

function HeroSection() {
  return (
    <div className="flex flex-col items-center">
      <Image
        src="/welcome.png"
        alt="Welcome"
        width={500}
        height={200}
        className="mb-4 drop-shadow-[0_0_15px_#00ffe0]"
      />
    </div>
  );
}
