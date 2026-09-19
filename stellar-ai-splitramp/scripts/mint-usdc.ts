import { Keypair, Horizon, TransactionBuilder, Operation, Asset, Networks } from '@stellar/stellar-sdk';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const server = new Horizon.Server('https://horizon-testnet.stellar.org');

// Müşteri Hesabı (USER_SECRET_HEX'ten türetilen public key)
const userKp = Keypair.fromRawEd25519Seed(
  Buffer.from((process.env.USER_SECRET_HEX || 'ebc86b9ef9fc23c377b97c9096684db9fe8ad8ec83002dd12ffff9e3b28d3529').trim(), 'hex')
);

// Bireysel Issuer Hesabı (Sabit bir seed'den türetiyoruz ki Issuer değişmesin)
const issuerSecretHex = '1111111111111111111111111111111111111111111111111111111111111111';
const issuerKp = Keypair.fromRawEd25519Seed(Buffer.from(issuerSecretHex, 'hex'));

const CUSTOM_USDC = new Asset('USDC', issuerKp.publicKey());

async function setupAndMint() {
  console.log('🚀 Özel Testnet USDC Tanımlama ve Mint İşlemi Başlatılıyor...\n');
  console.log(`  └─ Issuer Adresi: ${issuerKp.publicKey()}`);
  console.log(`  └─ User Adresi:   ${userKp.publicKey()}`);

  // 1. Issuer Hesabını Friendbot ile Aktifleştir
  try {
    await server.loadAccount(issuerKp.publicKey());
  } catch {
    console.log('  └─ Issuer hesabı kuruluyor (Friendbot)...');
    await fetch(`https://friendbot.stellar.org?addr=${issuerKp.publicKey()}`);
  }

  // 2. User Hesabının Trustline Açması
  const userAcc = await server.loadAccount(userKp.publicKey());
  const hasTrust = userAcc.balances.some(
    (b: any) => b.asset_code === 'USDC' && b.asset_issuer === issuerKp.publicKey()
  );

  if (!hasTrust) {
    console.log('  └─ User için bu Issuer USDC\'sine Trustline açılıyor...');
    const trustTx = new TransactionBuilder(userAcc, {
      fee: '1000',
      networkPassphrase: Networks.TESTNET,
    })
      .addOperation(Operation.changeTrust({ asset: CUSTOM_USDC }))
      .setTimeout(30)
      .build();

    trustTx.sign(userKp);
    await server.submitTransaction(trustTx);
    console.log('  └─ ✅ Trustline açıldı.');
  }

  // 3. Issuer -> User Hesabına 100 USDC Mint (Payment)
  const refreshedUserAcc = await server.loadAccount(userKp.publicKey());
  const issuerAcc = await server.loadAccount(issuerKp.publicKey());

  console.log('  └─ 100 USDC Mint ediliyor...');
  const mintTx = new TransactionBuilder(issuerAcc, {
    fee: '1000',
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      Operation.payment({
        destination: userKp.publicKey(),
        asset: CUSTOM_USDC,
        amount: '100.0000000',
      })
    )
    .setTimeout(30)
    .build();

  mintTx.sign(issuerKp);
  const res = await server.submitTransaction(mintTx);
  console.log(`  └─ 🎉 BAŞARILI! 100.00 USDC aktarıldı. Tx Hash: ${res.hash}\n`);
  console.log(`⚠️ ÖNEMLİ: Projenizdeki USDC Issuer adresini şu key ile güncelleyin:`);
  console.log(`NEXT_PUBLIC_USDC_ISSUER=${issuerKp.publicKey()}`);
}

setupAndMint();