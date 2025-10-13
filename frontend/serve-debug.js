const express = require('express');
const path = require('path');

const app = express();
const PORT = 3001;

// Serve static files from the frontend directory
app.use(express.static(__dirname));

// Serve the debug HTML file at root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'debug-frontend-auth.html'));
});

// CORS middleware to allow API calls
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Debug server running on http://localhost:${PORT}`);
  console.log(`📁 Serving files from: ${__dirname}`);
  console.log(`🔗 Access debug page at: http://localhost:${PORT}`);
  console.log(`🌐 Backend should be running on: http://localhost:5000`);
}); 