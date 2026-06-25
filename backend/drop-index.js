const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log('Connected');
  try {
    await mongoose.connection.collection('users').dropIndex('username_1');
    console.log('Dropped username index');
  } catch(e) {
    console.log(e.message);
  }
  process.exit();
});
