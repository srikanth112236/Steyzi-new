const PG = require('../models/pg.model');
const User = require('../models/user.model');

const samplePGs = [
  {
    name: "Sunshine Gents PG",
    description: "A modern and comfortable Gents PG with all amenities located in the heart of the city.",
    address: {
      street: "123 Main Street",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400001",
      landmark: "Near Central Station"
    },
    contact: {
      phone: "9876543210",
      email: "sunshine.gents@gmail.com",
      alternatePhone: "9876543211"
    },
    property: {
      type: "Gents PG"
    }
  },
  {
    name: "Green Valley Ladies PG",
    description: "Eco-friendly Ladies PG with beautiful garden and modern facilities.",
    address: {
      street: "456 Green Avenue",
      city: "Bangalore",
      state: "Karnataka",
      pincode: "560001",
      landmark: "Opposite City Park"
    },
    contact: {
      phone: "9876543212",
      email: "greenvalley.ladies@gmail.com",
      alternatePhone: "9876543213"
    },
    property: {
      type: "Ladies PG"
    }
  },
  {
    name: "Royal Coliving PG",
    description: "Luxury Coliving PG with premium amenities and excellent location.",
    address: {
      street: "789 Royal Road",
      city: "Delhi",
      state: "Delhi",
      pincode: "110001",
      landmark: "Near Metro Station"
    },
    contact: {
      phone: "9876543214",
      email: "royal.coliving@gmail.com",
      alternatePhone: "9876543215"
    },
    property: {
      type: "Coliving PG"
    }
  },
  {
    name: "Student Haven Gents PG",
    description: "Affordable Gents PG specifically designed for students with study-friendly environment.",
    address: {
      street: "321 Student Street",
      city: "Pune",
      state: "Maharashtra",
      pincode: "411001",
      landmark: "Near University Campus"
    },
    contact: {
      phone: "9876543216",
      email: "studenthaven.gents@gmail.com",
      alternatePhone: "9876543217"
    },
    property: {
      type: "Gents PG"
    }
  },
  {
    name: "Business Class Ladies PG",
    description: "Professional Ladies PG for working professionals with business center facilities.",
    address: {
      street: "654 Business Boulevard",
      city: "Hyderabad",
      state: "Telangana",
      pincode: "500001",
      landmark: "Near IT Park"
    },
    contact: {
      phone: "9876543218",
      email: "businessclass.ladies@gmail.com",
      alternatePhone: "9876543219"
    },
    property: {
      type: "Ladies PG"
    }
  }
];

const addSamplePGs = async (adminId) => {
  try {
    console.log('Adding sample PGs...');
    
    for (const pgData of samplePGs) {
      const pg = new PG({
        ...pgData,
        admin: adminId
      });
      
      await pg.save();
      console.log(`Added PG: ${pg.name}`);
    }
    
    console.log('Sample PGs added successfully!');
    return { success: true, message: 'Sample PGs added successfully' };
  } catch (error) {
    console.error('Error adding sample PGs:', error);
    return { success: false, message: error.message };
  }
};

const clearSamplePGs = async () => {
  try {
    console.log('Clearing sample PGs...');
    await PG.deleteMany({});
    console.log('Sample PGs cleared successfully!');
    return { success: true, message: 'Sample PGs cleared successfully' };
  } catch (error) {
    console.error('Error clearing sample PGs:', error);
    return { success: false, message: error.message };
  }
};

module.exports = {
  addSamplePGs,
  clearSamplePGs,
  samplePGs
}; 