'use client';
import { useState } from 'react';

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  // TRY ve USDC Dönüşüm Mantığı (Örn: 1 USD = 48.78 TRY)
  const usdRate = 48.78;
  const userTryBalance = 1000;
  const userUsdcBalance = (userTryBalance / usdRate).toFixed(2);

  const handleGenerate = async () => {
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/generate-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          userSecretKey: process.env.NEXT_PUBLIC_USER_SECRET, // Hex veya S-key
        }),
      });

      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setResult({
        success: false,
        error: err.message || 'Sunucuya bağlanırken bir hata oluştu.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-4xl mx-auto p-8 space-y-8 font-sans">
      <header className="border-b pb-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Stellar AI Micro-Split & Ramp</h1>
          <p className="text-sm text-gray-500">TL On-Ramp ➔ 10 Cent AI Split ➔ TL Off-Ramp</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-right">
          <span className="text-xs text-gray-500 block">Kullanıcı Bakiyesi</span>
          <span className="font-bold text-lg text-blue-700">
            {userTryBalance.toLocaleString('tr-TR')} TRY (~{userUsdcBalance} USDC)
          </span>
        </div>
      </header>

      {/* AI Prompt Input */}
      <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
        <h2 className="font-semibold text-lg">Görsel Üret (Maliyet: $0.10 USDC)</h2>
        <div className="flex gap-4">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Örn: Cyberpunk style Istanbul Bosphorus bridge at night..."
            className="flex-1 border p-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleGenerate}
            disabled={loading || !prompt}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Dağıtılıyor & Üretiliyor...' : 'Görsel Üret ($0.10)'}
          </button>
        </div>
      </div>

      {/* Hata Durumu Gösterimi */}
      {result && !result.success && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm">
          <p className="font-bold">❌ İşlem Başarısız Hatası:</p>
          <p>{result.error || 'Bilinmeyen bir hata oluştu.'}</p>
          {result.details && (
            <pre className="mt-2 text-xs bg-red-100 p-2 rounded overflow-x-auto">
              {JSON.stringify(result.details, null, 2)}
            </pre>
          )}
        </div>
      )}

      {/* Başarılı Sonuç & Canlı Stellar İşlemi */}
      {result && result.success && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 p-4 rounded-xl border">
            <h3 className="font-semibold mb-2 text-sm text-gray-700">Üretilen Görsel</h3>
            <img src={result.imageUrl} alt="AI Generated" className="w-full h-auto rounded-lg shadow" />
          </div>

          <div className="bg-gray-900 text-green-400 p-5 rounded-xl font-mono text-xs space-y-3 overflow-x-auto">
            <div className="flex items-center justify-between border-b border-gray-800 pb-2">
              <span className="text-gray-400">Stellar Atomic Split Status</span>
              <span className="bg-green-900/50 text-green-300 px-2 py-0.5 rounded text-[10px]">SUCCESS</span>
            </div>
            <p className="text-gray-300 break-all">Tx Hash: {result.txHash}</p>

            {/* Optional Chaining (?.): Sayfanın patlamasını engeller */}
            {result.costDetail && (
              <div className="space-y-1 text-gray-300">
                <p className="text-white font-bold">Dağıtım Detayı ($0.10 USDC):</p>
                <p>├─ AI Provider (%40) : {result.costDetail.aiShare}</p>
                <p>├─ Prompt Writer (%40): {result.costDetail.creatorShare}</p>
                <p>└─ Agency Vault (%20) : {result.costDetail.agencyShare}</p>
              </div>
            )}

            {result.txHash && (
              <a
                href={`https://stellar.expert/explorer/testnet/tx/${result.txHash}`}
                target="_blank"
                rel="noreferrer"
                className="inline-block text-blue-400 underline pt-2"
              >
                Stellar Expert'te İncele ↗
              </a>
            )}
          </div>
        </div>
      )}
    </main>
  );
}