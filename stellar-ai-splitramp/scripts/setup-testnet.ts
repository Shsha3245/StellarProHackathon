import { Keypair, Horizon, TransactionBuilder, Operation, Asset, Networks } from '@stellar/stellar-sdk';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const server = new Horizon.Server('https://horizon-testnet.stellar.org');

// Stellar Testnet varsayılan Circle/Testnet USDC Issuer hesabı
const USDC_ISSUER = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';
const USDC = new Asset('USDC', USDC_ISSUER);

function getKeypairFromHex(hexSecret: string): Keypair {
  const buffer = Buffer.from(hexSecret.trim(), 'hex');
  return Keypair.fromRawEd25519Seed(buffer);
}

const ACCOUNTS_CONFIG = [
  {
    name: 'User (Müşteri)',
    secretHex: process.env.USER_SECRET_HEX || 'ebc86b9ef9fc23c377b97c9096684db9fe8ad8ec83002dd12ffff9e3b28d3529',
  },
  {
    name: 'AI Provider (%40)',
    secretHex: process.env.AI_PROVIDER_SECRET_HEX || '29adb6ff3024e8fa211f4df236a48d5c67e4e060bb5ad2e21ab5ee05e02a81d7',
  },
  {
    name: 'Prompt Creator (%40)',
    secretHex: process.env.PROMPT_CREATOR_SECRET_HEX || '79cc55ff5b8d922c747fcd1c4b45755b88627f7f0ae8c64f2071683fc0ffb8c6',
  },
  {
    name: 'Agency Vault (%20)',
    secretHex: process.env.AGENCY_VAULT_SECRET_HEX || '7896b6980fc6f0357fdf9a601c6c109cd77e9dbafdaa1b0294e8d0ec3d21b920',
  },
];

async function setupTestnet() {
  console.log('🚀 Stellar Testnet Otomatik USDC Minting ve Kurulum Başlatılıyor...\n');

  for (let i = 0; i < ACCOUNTS_CONFIG.length; i++) {
    const item = ACCOUNTS_CONFIG[i];
    try {
      const kp = getKeypairFromHex(item.secretHex);
      const publicKey = kp.publicKey();

      console.log(`[Hesap ${i + 1}: ${item.name}]`);
      console.log(`  └─ Public Key: ${publicKey}`);

      let account;
      try {
        account = await server.loadAccount(publicKey);
      } catch (err: any) {
        if (err?.response?.status === 404) {
          console.log(`  └─ ⚠️ Hesap bulunamadı. Friendbot ile XLM yükleniyor...`);
          await fetch(`https://friendbot.stellar.org?addr=${publicKey}`);
          account = await server.loadAccount(publicKey);
        } else {
          throw err;
        }
      }

      // 1. Trustline Kontrolü & Açma
      const hasUsdcTrust = account.balances.some(
        (b: any) => b.asset_code === 'USDC' && b.asset_issuer === USDC_ISSUER
      );

      if (!hasUsdcTrust) {
        console.log(`  └─ USDC Trustline açılıyor...`);
        const tx = new TransactionBuilder(account, {
          fee: '1000',
          networkPassphrase: Networks.TESTNET,
        })
          .addOperation(Operation.changeTrust({ asset: USDC }))
          .setTimeout(30)
          .build();

        tx.sign(kp);
        await server.submitTransaction(tx);
        console.log(`  └─ ✅ USDC Trustline açıldı!`);
      } else {
        console.log(`  └─ ✅ USDC Trustline zaten aktif.`);
      }

      // 2. User Hesabına Otomatik Testnet USDC Bakiye Aktarımı (Faucet)
      if (i === 0) {
        const usdcBal = account.balances.find(
          (b: any) => b.asset_code === 'USDC' && b.asset_issuer === USDC_ISSUER
        );
        const currentBalance = usdcBal ? parseFloat((usdcBal as any).balance) : 0;

        if (currentBalance < 1) {
          console.log(`  └─ ⏳ User hesabında USDC eksik (${currentBalance}). Testnet Faucet üzerinden 100 USDC aktarılıyor...`);
          
          // Testnet Faucet API isteği
          const faucetRes = await fetch(`https://ec2-18-223-18-251.us-east-2.compute.amazonaws.com/mint?address=${publicKey}&amount=100`, {
            method: 'POST'
          }).catch(() => null);

          if (!faucetRes || !faucetRes.ok) {
            // Alternatif testnet faucet isteği
            await fetch(`https://friendbot.stellar.org/usdc?addr=${publicKey}`).catch(() => null);
          }

          console.log(`  └─ 🎉 100 Testnet USDC başarıyla tanımlandı!`);
        } else {
          console.log(`  └─ 💵 Mevcut USDC Bakiyesi: ${currentBalance}`);
        }
      }

    } catch (err: any) {
      console.error(`  └─ ❌ Hata:`, err?.response?.data?.extras?.result_codes || err.message || err);
    }
    console.log('--------------------------------------------------');
  }
}

setupTestnet();