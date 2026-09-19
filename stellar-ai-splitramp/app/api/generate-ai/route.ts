import { NextResponse } from 'next/server';
import {
  Asset,
  Operation,
  TransactionBuilder,
  Networks,
  Horizon,
  Keypair,
} from '@stellar/stellar-sdk';

const server = new Horizon.Server('https://horizon-testnet.stellar.org');

// Helper: HEX secret'ı Keypair'e dönüştür
function getKeypairFromHex(hexSecret: string): Keypair {
  const buffer = Buffer.from(hexSecret.trim(), 'hex');
  return Keypair.fromRawEd25519Seed(buffer);
}

export async function POST(req: Request) {
  try {
    // 1. Müşteri (User) Anahtarları
    const userSecretHex =
      process.env.USER_SECRET_HEX ||
      'ebc86b9ef9fc23c377b97c9096684db9fe8ad8ec83002dd12ffff9e3b28d3529';
    const userKp = getKeypairFromHex(userSecretHex);

    // 2. Alıcı Adresleri
    const payees = {
      aiProviderAddress:
        process.env.NEXT_PUBLIC_AI_PROVIDER_PUBKEY ||
        'GATQXW6AFM3OUHIO2YTZIS4AZTDSXFB5V5SYGNF7DP5HLFIKDFDBGU2T',
      promptCreatorAddress:
        process.env.NEXT_PUBLIC_PROMPT_CREATOR_PUBKEY ||
        'GBANHOL7HNMQCHCLIIK4EN2PXW4C2YZZN4CL7GP3B4ECNYHRDRZN5U3M',
      agencyVaultAddress:
        process.env.NEXT_PUBLIC_AGENCY_VAULT_PUBKEY ||
        'GBWMWQZ2RQYP252AKEWMALQ3SX6A7JHUTYQMQBTA4NT4NQS66AWHNOZT',
    };

    // 3. Gönderici Hesabını Ağdan Yükle
    const sourceAccount = await server.loadAccount(userKp.publicKey());

    // 4. TransactionBuilder Nesnesini Tanımla
    const transaction = new TransactionBuilder(sourceAccount, {
      fee: '1000',
      networkPassphrase: Networks.TESTNET,
    })
      .addOperation(
        Operation.payment({
          destination: payees.aiProviderAddress,
          asset: Asset.native(),
          amount: '0.4000000',
        })
      )
      .addOperation(
        Operation.payment({
          destination: payees.promptCreatorAddress,
          asset: Asset.native(),
          amount: '0.4000000',
        })
      )
      .addOperation(
        Operation.payment({
          destination: payees.agencyVaultAddress,
          asset: Asset.native(),
          amount: '0.2000000',
        })
      )
      .setTimeout(30)
      .build();

    // 5. İmzala ve Ağa Gönder
    transaction.sign(userKp);
    const result = await server.submitTransaction(transaction);

    console.log('✅ XLM Split Ödeme Başarılı! Tx Hash:', result.hash);

    // Bura da senin AI Görsel üretme logic'in (örneğin Pollinations veya Replicate çağrısı)
    return NextResponse.json({
      success: true,
      txHash: result.hash,
      imageUrl: 'https://pollinations.ai/p/a_futuristic_stellar_blockchain_cyberpunk_city',
    });
  } catch (error: any) {
    console.error('❌ Transfer Hatası:', error?.response?.data || error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}