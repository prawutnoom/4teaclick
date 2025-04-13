import { useEffect, useState } from "react";
import { ethers } from "ethers";

// Mock ABI สำหรับฟังก์ชัน claim
const contractABI = [
  {
    "inputs": [],
    "name": "claim",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

// Smart contract address ที่ deploy จริง
const contractAddress = "0x5f81f2fbdE2B98Ab0F9c0C4d6CC15e8380B88686";

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
            chainId: "0xaa37ec", // Tea Sepolia Chain ID
            chainName: "Tea Sepolia",
            nativeCurrency: {
              name: "TEA",
              symbol: "TEA",
              decimals: 18
            },
            rpcUrls: ["https://tea-sepolia.g.alchemy.com/v2/0qiY9LelIcif8b0uECA5nFbWeTDvsU3t"],
            blockExplorerUrls: ["https://sepolia.explorer.tea.xyz"]
          }
        ]
      });
    } catch (err) {
      console.error("Add chain error:", err);
    }
  };

  const handleClickTx = async () => {
  if (!signer) {
    console.log("❌ ยังไม่มี signer");
    return;
  }

  console.log("✅ signer พร้อม:", signer);

  setIsLoading(true);
  try {
    const contract = new ethers.Contract(contractAddress, contractABI, signer);
    console.log("🚀 เรียก contract.claim()");

    const tx = await contract.claim();
    await tx.wait();

    console.log("✅ TX สำเร็จ:", tx.hash);
    setTxHash(tx.hash);
  } catch (err) {
    console.error("❌ Transaction error:", err);
  } finally {
    setIsLoading(false);
  }
};


  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-blue-400 p-6 space-y-6">
      <h1 className="text-4xl font-bold text-blue-300 drop-shadow-lg">Claim Reward</h1>

      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={addTeaSepoliaNetwork}
          className="bg-yellow-500 px-6 py-3 rounded-xl hover:bg-yellow-400 text-black shadow-md"
        >
          คลิกเพื่อแอดเชน Tea Sepolia
        </button>

        <a
          href="https://sepolia.faucet.tea.xyz"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-purple-600 px-6 py-3 rounded-xl hover:bg-purple-500 text-white shadow-md"
        >
          Get TEA
        </a>
      </div>

      <div className="flex flex-col items-center space-y-4 mt-8">
        {walletAddress ? (
          <>
            <p className="text-green-300 text-sm">Connected: {walletAddress}</p>
            <button
              onClick={handleClickTx}
              className="bg-blue-600 px-10 py-5 rounded-2xl hover:bg-blue-500 disabled:opacity-50 shadow-blue-400 shadow-md text-lg"
              disabled={isLoading}
            >
              {isLoading ? "Claiming..." : "Click to Claim"}
            </button>
            {txHash && (
              <p className="mt-2 text-sm text-green-400">
                TX Hash: <a href={`https://sepolia.etherscan.io/tx/${txHash}`} target="_blank" className="underline">{txHash}</a>
              </p>
            )}
          </>
        ) : (
          <button
            onClick={connectWallet}
            className="bg-green-500 text-black font-semibold text-lg px-8 py-4 rounded-2xl hover:bg-green-400 shadow-lg shadow-green-300"
          >
            Connect Wallet (MetaMask, Rabby, OKX...)
          </button>
        )}
      </div>
    </div>
  );
}
