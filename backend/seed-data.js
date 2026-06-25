const BASE = 'http://localhost:5000/api';

async function seed() {
  let token;
  const EMAIL = 'smartfinance@demo.com';
  const PASSWORD = 'demo123';

  // 1. Try Register, if user exists then Login
  console.log('🔐 Registering / Logging in...');
  const regRes = await fetch(`${BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Devesh', email: EMAIL, password: PASSWORD })
  });
  const regData = await regRes.json();

  if (regRes.ok) {
    token = regData.token;
    console.log('✅ Registered successfully');
  } else {
    // User already exists, login
    const loginRes = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: EMAIL, password: PASSWORD })
    });
    const loginData = await loginRes.json();
    if (!loginRes.ok) {
      console.error('❌ Login failed:', loginData.message);
      return;
    }
    token = loginData.token;
    console.log('✅ Logged in successfully');
  }

  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  // 2. Check existing accounts
  const finRes = await fetch(`${BASE}/finance`, { headers });
  const finData = await finRes.json();
  
  let sbiAccount, gpayAccount;

  if (finData.accounts && finData.accounts.length > 0) {
    console.log(`ℹ️  Already have ${finData.accounts.length} account(s), skipping account creation`);
    sbiAccount = finData.accounts[0];
    gpayAccount = finData.accounts[1] || finData.accounts[0];
  } else {
    // 3. Add Bank Account - SBI
    console.log('🏦 Adding SBI Bank account...');
    const sbiRes = await fetch(`${BASE}/finance/accounts/add`, {
      method: 'POST', headers,
      body: JSON.stringify({ name: 'SBI Bank', startingBalance: 75000, iconType: 'Landmark' })
    });
    sbiAccount = await sbiRes.json();
    console.log('✅ SBI Bank added - Balance: ₹75,000');

    // 4. Add Wallet - Google Pay
    console.log('📱 Adding Google Pay wallet...');
    const gpayRes = await fetch(`${BASE}/finance/accounts/add`, {
      method: 'POST', headers,
      body: JSON.stringify({ name: 'Google Pay', startingBalance: 5000, iconType: 'Smartphone' })
    });
    gpayAccount = await gpayRes.json();
    console.log('✅ Google Pay added - Balance: ₹5,000');
  }

  // 5. Add Sample Transactions
  const now = new Date();
  const formatDate = (daysAgo) => {
    const d = new Date(now);
    d.setDate(d.getDate() - daysAgo);
    const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    return `${d.getDate().toString().padStart(2, '0')} ${d.toLocaleString('en-GB', { month: 'short' })} ${d.getFullYear()} at ${timeStr}`;
  };

  const sampleTransactions = [
    { title: 'Salary Credit', cat: 'Income', date: formatDate(0), amt: '+₹45,000', isExpense: false, numericAmount: 45000, sourceAccountId: sbiAccount.id },
    { title: 'Swiggy - Biryani', cat: 'Food', date: formatDate(0), amt: '-₹350', isExpense: true, numericAmount: 350, sourceAccountId: gpayAccount.id },
    { title: 'Uber Ride', cat: 'Travel', date: formatDate(1), amt: '-₹220', isExpense: true, numericAmount: 220, sourceAccountId: gpayAccount.id },
    { title: 'Amazon Shopping', cat: 'Shopping', date: formatDate(1), amt: '-₹2,499', isExpense: true, numericAmount: 2499, sourceAccountId: sbiAccount.id },
    { title: 'Electricity Bill', cat: 'Bills', date: formatDate(2), amt: '-₹1,200', isExpense: true, numericAmount: 1200, sourceAccountId: sbiAccount.id },
    { title: 'Netflix Subscription', cat: 'Entertainment', date: formatDate(2), amt: '-₹649', isExpense: true, numericAmount: 649, sourceAccountId: sbiAccount.id },
    { title: 'Freelance Payment', cat: 'Income', date: formatDate(3), amt: '+₹12,000', isExpense: false, numericAmount: 12000, sourceAccountId: sbiAccount.id },
    { title: 'Starbucks Coffee', cat: 'Food', date: formatDate(3), amt: '-₹450', isExpense: true, numericAmount: 450, sourceAccountId: gpayAccount.id },
    { title: 'Petrol Fill', cat: 'Travel', date: formatDate(4), amt: '-₹1,500', isExpense: true, numericAmount: 1500, sourceAccountId: sbiAccount.id },
    { title: 'Zara T-Shirt', cat: 'Shopping', date: formatDate(5), amt: '-₹1,899', isExpense: true, numericAmount: 1899, sourceAccountId: sbiAccount.id },
    { title: 'Mobile Recharge', cat: 'Bills', date: formatDate(5), amt: '-₹599', isExpense: true, numericAmount: 599, sourceAccountId: gpayAccount.id },
    { title: 'Movie Tickets', cat: 'Entertainment', date: formatDate(6), amt: '-₹800', isExpense: true, numericAmount: 800, sourceAccountId: gpayAccount.id },
  ];

  console.log('\n📝 Adding sample transactions...');
  for (const tx of sampleTransactions) {
    const txRes = await fetch(`${BASE}/finance/transactions/add`, {
      method: 'POST', headers,
      body: JSON.stringify(tx)
    });
    if (txRes.ok) {
      console.log(`  ✅ ${tx.isExpense ? '🔴' : '🟢'} ${tx.title} → ${tx.amt}`);
    } else {
      const err = await txRes.json();
      console.log(`  ❌ ${tx.title} failed: ${err.message}`);
    }
  }

  // 6. Final check
  const finalRes = await fetch(`${BASE}/finance`, { headers });
  const finalData = await finalRes.json();
  
  console.log('\n🎉 Seed Complete!');
  console.log(`   Accounts: ${finalData.accounts.length}`);
  console.log(`   Transactions: ${finalData.transactions.length}`);
  finalData.accounts.forEach(a => console.log(`   💰 ${a.name}: ₹${a.balance.toLocaleString()}`));
  console.log('\n📱 Login credentials:');
  console.log(`   Email: ${EMAIL}`);
  console.log(`   Password: ${PASSWORD}`);
}

seed().catch(err => console.error('❌ Seed failed:', err.message));
