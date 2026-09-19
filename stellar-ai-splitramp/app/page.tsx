'use client';

import { useState, useEffect } from 'react';

interface WalletBalance {
  role: string;
  address: string;
  balance: string;
  share: string;
  color: string;
}

export default function Home() {
  const [prompt, setPrompt] = useState('A futuristic Stellar blockchain cyberpunk city, 8k render');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; txHash?: string; imageUrl?: string; error?: string } | null>(null);

  // 4 Cüzdanın Canlı Durumu
  const [wallets, setWallets] = useState<WalletBalance[]>([
    {
      role: 'Müşteri (User)',
      address: 'GCELJJBYRUR5TBNE2ZMISV5RDQCM5UDYWKOTYNWMNXRENANM6TTSPHMJ',
      balance: '...',
      share: 'Ödeyen (-1.0 XLM)',
      color: 'border-blue-500/50 bg-blue-950/20',
    },
    {
      role: 'AI Model Provider',
      address: process.env.NEXT_PUBLIC_AI_PROVIDER_PUBKEY || 'GATQXW6AFM3OUHIO2YTZIS4AZTDSXFB5V5SYGNF7DP5HLFIKDFDBGU2T',
      balance: '...',
      share: '+%40 (0.4 XLM)',
      color: 'border-purple-500/50 bg-purple-950/20',
    },
    {
      role: 'Prompt Creator',
      address: process.env.NEXT_PUBLIC_PROMPT_CREATOR_PUBKEY || 'GBANHOL7HNMQCHCLIIK4EN2PXW4C2YZZN4CL7GP3B4ECNYHRDRZN5U3M',
      balance: '...',
      share: '+%40 (0.4 XLM)',
      color: 'border-emerald-500/50 bg-emerald-950/20',
    },
    {
      role: 'Agency Vault',
      address: process.env.NEXT_PUBLIC_AGENCY_VAULT_PUBKEY || 'GBWMWQZ2RQYP252AKEWMALQ3SX6A7JHUTYQMQBTA4NT4NQS66AWHNOZT',
      balance: '...',
      share: '+%20 (0.2 XLM)',
      color: 'border-amber-500/50 bg-amber-950/20',
    },
  ]);

  // Horizon API'den Bakiyeleri Çek
  const fetchBalances = async () => {
    try {
      const updatedWallets = await Promise.all(
        wallets.map(async (w) => {
          try {
            const res = await fetch(`https://horizon-testnet.stellar.org/accounts/${w.address}`);
            if (!res.ok) return { ...w, balance: '0.00' };
            const data = await res.json();
            const nativeBalance = data.balances.find((b: any) => b.asset_type === 'native');
            return {
              ...w,
              balance: nativeBalance ? parseFloat(nativeBalance.balance).toFixed(2) : '0.00',
            };
          } catch {
            return { ...w, balance: 'Hata' };
          }
        })
      );
      setWallets(updatedWallets);
    } catch (e) {
      console.error('Bakiye çekme hatası:', e);
    }
  };

  useEffect(() => {
    fetchBalances();
  }, []);

  const handleGenerate = async () => {
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/generate-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json();
      setResult(data);

      if (data.success) {
        // İşlem başarılıysa bakiyeleri hemen güncelle
        setTimeout(fetchBalances, 1500);
      }
    } catch (err: any) {
      setResult({ success: false, error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Navbar */}
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-50 px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-blue-500 flex items-center justify-center font-bold text-white">
            S
          </div>
          <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
            Stellar SplitRamp AI Agency
          </span>
        </div>
        <div className="flex gap-6 text-sm text-slate-400">
          <a href="#dashboard" className="hover:text-white transition">Cüzdanlar</a>
          <a href="#playground" className="hover:text-white transition">AI Playground</a>
          <a href="#agency" className="hover:text-white transition">Ajans Hizmetleri</a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-8 py-20 text-center max-w-5xl mx-auto space-y-6">
        <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
          Powered by Stellar Testnet • Atomic XLM Micro-Splits
        </span>
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl text-slate-100">
          Otonom AI Üretimi & <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">Şeffaf Telif Paylaşımı</span>
        </h1>
        <p className="text-lg text-slate-400 max-w-3xl mx-auto">
          Müşterileriniz görsel üretsin, ödemeler akıllı altyapıyla Model Sağlayıcısı (%40), Prompt Sanatçısı (%40) ve Ajans Kasası (%20) arasında anında bölünsün.
        </p>
      </section>

      {/* 4 Cüzdan Canlı Bakiye Paneli */}
      <section id="dashboard" className="max-w-6xl mx-auto px-8 mb-16">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <span>💳</span> Canlı Cüzdan & Gelir Dağılımı
          </h2>
          <button 
            onClick={fetchBalances} 
            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded border border-slate-700 transition"
          >
            🔄 Bakiyeleri Yenile
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {wallets.map((w, idx) => (
            <div key={idx} className={`p-5 rounded-xl border ${w.color} backdrop-blur flex flex-col justify-between`}>
              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-slate-400">{w.role}</span>
                <p className="text-2xl font-black mt-2 text-white">{w.balance} <span className="text-xs font-normal text-slate-400">XLM</span></p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800/80">
                <span className="text-xs font-semibold text-purple-300 block">{w.share}</span>
                <p className="text-[10px] text-slate-500 font-mono truncate mt-1" title={w.address}>{w.address}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Interactive AI Playground */}
      <section id="playground" className="max-w-4xl mx-auto px-8 py-12 bg-slate-900/60 border border-slate-800 rounded-2xl mb-20 backdrop-blur">
        <h2 className="text-2xl font-bold mb-2">🎨 AI Prompt Studio</h2>
        <p className="text-sm text-slate-400 mb-6">Bir prompt seçin veya kendi isteminizi yazın. Görsel üretildiğinde 1.0 XLM tek işlemde 3 paydaşa bölünecektir.</p>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">Prompt İstemi</label>
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-purple-500 transition"
              placeholder="Prompt yazın..."
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setPrompt('A futuristic Stellar blockchain cyberpunk city, 8k render')}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded transition"
            >
              🌆 Cyberpunk City
            </button>
            <button
              onClick={() => setPrompt('Cute red panda coding on a laptop in a cozy room, digital art')}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded transition"
            >
              🐼 Red Panda Dev
            </button>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold py-3.5 rounded-lg transition disabled:opacity-50 shadow-lg shadow-purple-500/10"
          >
            {loading ? '⚡ Stellar Ağında Ödeme Bölünüyor & Görsel Üretiliyor...' : '🚀 Görsel Üret (1.0 XLM Micro-Split)'}
          </button>
        </div>

        {/* Sonuç Ekranı */}
        {result && (
          <div className="mt-8 pt-6 border-t border-slate-800">
            {result.success ? (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-950/30 border border-emerald-500/30 rounded-lg text-emerald-400 text-sm flex justify-between items-center">
                  <span>✅ **Ödeme Başarılı:** XLM 3 cüzdana atomik bölündü!</span>
                  <a
                    href={`https://horizon-testnet.stellar.org/transactions/${result.txHash}/operations`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs underline hover:text-emerald-300"
                  >
                    Horizon Proof ↗
                  </a>
                </div>

                {result.imageUrl && (
                  <div className="relative rounded-lg overflow-hidden border border-slate-800 bg-slate-950">
                    <img src={result.imageUrl} alt="AI Result" className="w-full h-auto object-cover max-h-[400px]" />
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 bg-rose-950/30 border border-rose-500/30 rounded-lg text-rose-400 text-sm">
                ❌ İşlem Başarısız: {result.error}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
