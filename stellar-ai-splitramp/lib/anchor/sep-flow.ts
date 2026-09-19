import { Keypair, Networks, TransactionBuilder } from '@stellar/stellar-sdk';
import { StellarToml } from '@stellar/stellar-sdk';

const HOME_DOMAIN = 'tr-mock-anchor.fly.dev';

export interface AnchorConfig {
  webAuthEndpoint: string;
  transferServer: string;
  quoteServer: string;
  signingKey: string;
  usdcIssuer: string;
}

// 1. ADIM: SEP-1 - Dynamic Discovery (stellar.toml Keşfi)
async function discoverAnchor() {
  // Resolver sınıfını kullan
  const toml = await StellarToml.Resolver.resolve('https://tr-mock-anchor.fly.dev');

  return {
    webAuthEndpoint: toml.WEB_AUTH_ENDPOINT,
    transferServer: toml.TRANSFER_SERVER,
    quoteServer: toml.ANCHOR_QUOTE_SERVER,
    signingKey: toml.SIGNING_KEY,
    usdcIssuer: toml.CURRENCIES?.find((c: any) => c.code === 'USDC')?.issuer || '',
  };
}

// 2. ADIM: SEP-10 - Non-Custodial Auth (Challenge & JWT)
export async function authenticateSEP10(keypair: Keypair, authEndpoint: string): Promise<string> {
  const publicKey = keypair.publicKey();
  
  // Challenge al
  const challengeRes = await fetch(`${authEndpoint}?account=${publicKey}`);
  const { transaction } = await challengeRes.json();

  // Imzala
  const tx = TransactionBuilder.fromXDR(transaction, Networks.TESTNET);
  tx.sign(keypair);

  // Token al
  const tokenRes = await fetch(authEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transaction: tx.toXDR() }),
  });

  const { token } = await tokenRes.json();
  return token;
}

// 3. ADIM: SEP-38 - Kur Kilitleme (Reflector Oracle + Spread)
export async function getSEP38Quote(
  token: string, 
  quoteEndpoint: string, 
  amountTRY: string,
  usdcIssuer: string
) {
  const res = await fetch(`${quoteEndpoint}/quote`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sell_asset: 'iso4217:TRY',
      buy_asset: `stellar:USDC:${usdcIssuer}`,
      sell_amount: amountTRY,
    }),
  });

  return await res.json(); // quote.id, quote.buy_amount, quote.price
}

// 4. ADIM: SEP-6 - Deposit Başlatma (TRY -> USDC)
export async function startDeposit(
  token: string, 
  transferEndpoint: string, 
  publicKey: string, 
  amountTRY: string,
  quoteId?: string
) {
  const params = new URLSearchParams({
    asset_code: 'USDC',
    account: publicKey,
    amount: amountTRY,
  });

  if (quoteId) {
    params.append('quote_id', quoteId);
  }

  const res = await fetch(`${transferEndpoint}/deposit?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return await res.json(); // deposit.id, deposit.how (IBAN + Referans)
}

// 5. ADIM: Banka Transfer Simülasyonu (Sandbox Modu)
export async function simulateBankTransfer(token: string, depositId: string, amountTRY: string) {
  await fetch(`https://${HOME_DOMAIN}/sep6/tx/${depositId}/simulate-bank-transfer`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ amount: amountTRY }),
  });
}