const mongoose = require('mongoose');
const Ticket = require('./src/models/ticket.model');
const User = require('./src/models/user.model');

async function checkTickets() {
  try {
    await mongoose.connect('mongodb://localhost:27017/pg_maintenance');

    console.log('Checking tickets and assignments...\n');

    // Get all tickets
    const allTickets = await Ticket.find({}).select('title status assignedTo createdAt').limit(10);
    console.log('Sample tickets:');
    allTickets.forEach(ticket => {
      console.log(`- ${ticket.title}: ${ticket.status}, assignedTo: ${ticket.assignedTo} (${typeof ticket.assignedTo})`);
    });

    // Get tickets with assignedTo
    const assignedTickets = await Ticket.find({ assignedTo: { $exists: true, $ne: null } });
    console.log(`\nTotal tickets with assignments: ${assignedTickets.length}`);

    // Get support users
    const supportUsers = await User.find({ role: 'support' }).select('_id firstName lastName email');
    console.log('\nSupport users:');
    supportUsers.forEach(user => {
      console.log(`- ${user.firstName} ${user.lastName}: ${user._id}`);
    });

    // Check tickets assigned to support users
    for (const user of supportUsers.slice(0, 3)) { // Check first 3 users
      const userTickets = await Ticket.find({
        $or: [
          { assignedTo: user._id },
          { $expr: { $eq: [{ $toString: '$assignedTo' }, user._id.toString()] } }
        ]
      });
      console.log(`\nTickets assigned to ${user.firstName} ${user.lastName}: ${userTickets.length}`);
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkTickets();
