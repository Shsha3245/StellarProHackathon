const { Keypair } = require('stellar-sdk');

const account1 = Keypair.random();
const account2 = Keypair.random();
const account3 = Keypair.random();
const account4 = Keypair.random();

console.log(account1.publicKey(), account1.secret());
console.log(account2.publicKey(), account2.secret());
console.log(account3.publicKey(), account3.secret());
console.log(account4.publicKey(), account4.secret());

const axios = require('axios');

async function fundAccount(publicKey) {
  try {
    const res = await axios.get(`https://friendbot.stellar.org/?addr=${publicKey}`);
    console.log(`Funded: ${publicKey}`, res.data);
  } catch (err) {
    console.error(`Error funding ${publicKey}`, err);
  }
}

fundAccount(account1.publicKey());
fundAccount(account2.publicKey());
fundAccount(account3.publicKey());
fundAccount(account4.publicKey());
