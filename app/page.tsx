"use client";

import { useEffect, useState } from "react";

const CONTRACT = "0x58280d25CBfE016CC2A31b0Ab341536287Ce872B";

export default function Home() {
  const [wallet, setWallet] = useState("");
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const connectWallet = async () => {
    const accounts = await (window as any).ethereum.request({
      method: "eth_requestAccounts",
    });

    setWallet(accounts[0]);
    loadLeaderboard();
  };

  // encode function call manually
  const encodeGetUsers = () => {
    return "0x1c7a9a1c"; // getUsers()
  };

  const encodeGetInvites = (addr: string) => {
    return (
      "0xd3b7f7b2" +
      addr.slice(2).padStart(64, "0")
    );
  };

  const call = async (data: string) => {
    return await (window as any).ethereum.request({
      method: "eth_call",
      params: [
        {
          to: CONTRACT,
          data,
        },
        "latest",
      ],
    });
  };

  const parseAddressArray = (hex: string) => {
    if (!hex || hex === "0x") return [];
    return []; // ساده نگه داشتیم چون decode پیچیده است
  };

  const loadLeaderboard = async () => {
    try {
      setLoading(true);

      // ⚠️ محدودیت نسخه بدون ethers:
      // فقط invite مستقیم نمی‌تونیم کامل decode کنیم بدون ABI lib

      const usersHex = await call(encodeGetUsers());

      const users = parseAddressArray(usersHex);

      const data = await Promise.all(
        users.map(async (u: string) => {
          const invHex = await call(encodeGetInvites(u));
          const invites = parseInt(invHex, 16) || 0;

          return {
            address: u,
            invites,
          };
        })
      );

      data.sort((a, b) => b.invites - a.invites);

      setLeaderboard(data);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (wallet) loadLeaderboard();
  }, [wallet]);

  return (
    <div style={{ textAlign: "center", marginTop: 50 }}>
      <h1>Kanciler Leaderboard</h1>

      <button onClick={connectWallet}>
        {wallet ? "Connected" : "Connect Wallet"}
      </button>

      <p style={{ fontSize: 12 }}>{wallet}</p>

      <hr />

      <h2>Leaderboard</h2>

      {loading && <p>Loading...</p>}

      {leaderboard.length === 0 && !loading && (
        <p>No data yet (need register calls)</p>
      )}

      {leaderboard.map((u, i) => (
        <div key={i}>
          #{i + 1} — {u.address?.slice(0, 6)}... — {u.invites}
        </div>
      ))}
    </div>
  );
}