const mongoose = require('mongoose');
const PG = require('./src/models/pg.model');

async function checkPG() {
  try {
    await mongoose.connect('mongodb://localhost:27017/steyzi');

    // Check specific PG
    const pg = await PG.findById('68ec6cd2d7765bf384c68a42');
    console.log('Specific PG exists:', !!pg);
    if (pg) {
      console.log('PG data:', JSON.stringify({
        _id: pg._id,
        name: pg.name,
        admin: pg.admin,
        isConfigured: pg.isConfigured
      }, null, 2));
    }

    // Check all PGs
    const allPGs = await PG.find({}).limit(5);
    console.log('Total PGs in database:', allPGs.length);
    allPGs.forEach((pg, index) => {
      console.log(`PG ${index + 1}:`, {
        _id: pg._id.toString(),
        name: pg.name,
        admin: pg.admin?.toString()
      });
    });

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}
checkPG();
