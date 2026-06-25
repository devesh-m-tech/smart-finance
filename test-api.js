const axios = require('axios');

async function test() {
  try {
    const ts = Date.now();
    const email = `test${ts}@test.com`;
    console.log("Registering...", email);
    const reg = await axios.post('http://localhost:5000/api/auth/register', {
      name: 'Test', email, password: 'password'
    });
    const token = reg.data.token;
    console.log("Got token:", token.substring(0, 20) + "...");

    console.log("Adding account...");
    const addAcc = await axios.post('http://localhost:5000/api/finance/accounts/add', {
      name: 'Test Bank', startingBalance: 1000, iconType: 'Landmark'
    }, { headers: { Authorization: `Bearer ${token}` } });
    console.log("Account added:", addAcc.data);

  } catch(e) {
    console.error(e.response ? e.response.data : e.message);
  }
}
test();
