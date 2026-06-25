async function test() {
  try {
    const ts = Date.now();
    // Register
    const regRes = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test', email: `t${ts}@t.com`, password: 'pass' })
    });
    const { token } = await regRes.json();
    console.log('Token:', token ? 'OK' : 'MISSING');

    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

    // Add bank
    const bankRes = await fetch('http://localhost:5000/api/finance/accounts/add', {
      method: 'POST', headers,
      body: JSON.stringify({ name: 'SBI Bank', startingBalance: 50000, iconType: 'Landmark' })
    });
    const bank = await bankRes.json();
    console.log('Bank:', bank);

    // Add wallet
    const walletRes = await fetch('http://localhost:5000/api/finance/accounts/add', {
      method: 'POST', headers,
      body: JSON.stringify({ name: 'Google Pay', startingBalance: 0, iconType: 'LayoutGrid' })
    });
    const wallet = await walletRes.json();
    console.log('Wallet:', wallet);

    // Link wallet to bank
    const linkRes = await fetch('http://localhost:5000/api/finance/accounts/link', {
      method: 'PUT', headers,
      body: JSON.stringify({ walletId: wallet.id, bankId: bank.id })
    });
    const link = await linkRes.json();
    console.log('Link result:', link);

  } catch(e) { console.error(e.message); }
}
test();
