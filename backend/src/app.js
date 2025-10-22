// Import maintainer routes
const maintainerRoutes = require('./routes/maintainer.routes');

// Add maintainer routes
app.use('/api/maintainers', maintainerRoutes);
