const mongoose = require('mongoose');
const User = require('./src/models/user.model');

async function checkUser() {
  try {
    await mongoose.connect('mongodb://localhost:27017/steyzi');
    const user = await User.findById('68ec8a1a6530853cd6dd23ee');
    console.log('User pgId:', user?.pgId);
    console.log('User pgConfigured:', user?.pgConfigured);
    console.log('User full object:', JSON.stringify(user, null, 2));
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}
checkUser();
