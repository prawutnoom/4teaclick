import { useEffect, useState } from "react";
import { ethers } from "ethers";

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
const RPC = "https://tea-sepolia.g.alchemy.com/v2/0qiY9LelIcif8b0uECA5nFbWeTDvsU3t"; // ใส่ของคุณแทน

export default function ClickToTxDApp() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [walletAddress, setWalletAddress] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState(null);
  const [userClickCount, setUserClickCount] = useState(0);
  const [intervalId, setIntervalId] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined" && typeof window.ethereum !== "undefined") {
      const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
      setProvider(web3Provider);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [intervalId]);

  const fetchUserClickCount = async (userAddress) => {
    if (!userAddress) return;

    const rpcProvider = new ethers.providers.JsonRpcProvider(RPC);
    const contract = new ethers.Contract(contractAddress, contractABI, rpcProvider);

    try {
      const latestBlock = await rpcProvider.getBlockNumber();
      const fromBlock = Math.max(latestBlock - 5000, 0);

      const logs = await contract.queryFilter("Claimed", fromBlock, "latest");

      console.log("🧾 logs.length =", logs.length);

      const userLogs = logs.filter(
        (log) => log.args.user.toLowerCase() === userAddress.toLowerCase()
      );

      console.log("🙋‍♂️ userLogs.length =", userLogs.length);

      setUserClickCount(userLogs.length);
    } catch (err) {
      console.error("❌ Error fetching click count:", err);
    }
  };

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

      fetchUserClickCount(address);

      const id = setInterval(() => {
        fetchUserClickCount(address);
      }, 15000);
      setIntervalId(id);
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
      fetchUserClickCount(walletAddress);
    } catch (err) {
      console.error("❌ Transaction error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-blue-400 p-6 space-y-6">
      {walletAddress && (
        <>
          <p className="text-green-300 text-sm mb-2">Connected: {walletAddress}</p>
          <p className="text-sm text-white">
            Your Clicks: <span className="text-cyan-300 font-semibold">{userClickCount}</span>
          </p>
        </>
      )}

      <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 drop-shadow-lg">
        Dapp Tea Protocol
      </h1>

      <div className="flex flex-col items-center space-y-4 mt-6">
        {walletAddress ? (
          <>
            <button
              onClick={handleClickTx}
              className="w-[200px] h-[200px] bg-blue-500 hover:bg-blue-600 rounded-full text-white text-2xl font-bold shadow-xl flex items-center justify-center"
              disabled={isLoading}
            >
              {isLoading ? "..." : "Let’s go"}
            </button>
            {txHash && (
              <p className="mt-2 text-sm text-green-400">
                TX Hash:{" "}
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
          </>
        ) : (
          <button
            onClick={connectWallet}
            className="bg-green-500 text-black font-semibold text-lg px-8 py-4 rounded-2xl hover:bg-green-400 shadow-lg shadow-green-300"
          >
            Connect Wallet
          </button>
        )}
      </div>

      <div className="fixed bottom-6 flex justify-center w-full gap-4">
        <button
          onClick={addTeaSepoliaNetwork}
          className="bg-yellow-500 text-black text-sm px-4 py-2 rounded-xl hover:bg-yellow-400 shadow-md"
        >
          Add Chain Tea Sepolia
        </button>

        <a
          href="https://faucet-sepolia.tea.xyz/"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-purple-600 text-white text-sm px-4 py-2 rounded-xl hover:bg-purple-500 shadow-md"
        >
          Get TEA
        </a>
      </div>
    </div>
  );
}
