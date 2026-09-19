import {
  Keypair,
  Networks,
  Operation,
  Asset,
  TransactionBuilder,
  Horizon,
} from '@stellar/stellar-sdk';

const HORIZON_URL = 'https://horizon-testnet.stellar.org';
const USDC_ISSUER = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';
const USDC = new Asset('USDC', USDC_ISSUER);

const server = new Horizon.Server(HORIZON_URL);

export interface SplitPayees {
  aiProviderAddress: string;   // %40 (0.04 USDC - 10 centin)
  promptCreatorAddress: string; // %40 (0.04 USDC)
  agencyVaultAddress: string;   // %20 (0.02 USDC)
}

/**
 * AI Görsel üretildiğinde 10 cent ($0.10 USDC) tutarını 
 * 3 tarafa TEK BİR ATOMİK TRANSACTİON içinde böler.
 */
export async function executeAiMicroPaymentSplit(
  payerKeypair: Keypair,
  payees: SplitPayees,
  totalUsdcCost: string = '0.10'
) {
  const account = await server.loadAccount(payerKeypair.publicKey());

  // 10 cent = $0.10 USDC
  const cost = parseFloat(totalUsdcCost);
  const aiShare = (cost * 0.40).toFixed(7);      // 0.0400000 USDC
  const creatorShare = (cost * 0.40).toFixed(7); // 0.0400000 USDC
  const agencyShare = (cost * 0.20).toFixed(7);  // 0.0200000 USDC

  const tx = new TransactionBuilder(account, {
    fee: '100',
    networkPassphrase: Networks.TESTNET,
  })
    // Op 1: AI Model Sağlayıcıya
    .addOperation(
      Operation.payment({
        destination: payees.aiProviderAddress,
        asset: USDC,
        amount: aiShare,
      })
    )
    // Op 2: İçerik / Prompt Üreticisine
    .addOperation(
      Operation.payment({
        destination: payees.promptCreatorAddress,
        asset: USDC,
        amount: creatorShare,
      })
    )
    // Op 3: Ajans Komisyon Kasasına
    .addOperation(
      Operation.payment({
        destination: payees.agencyVaultAddress,
        asset: USDC,
        amount: agencyShare,
      })
    )
    .setTimeout(30)
    .build();

  tx.sign(payerKeypair);

  // Stellar ağında 3 ödeme tek atımda gerçekleşir
  return await server.submitTransaction(tx);
}