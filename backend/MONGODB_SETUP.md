# MongoDB Setup Guide

## Option 1: Local MongoDB Installation

### Windows
1. Download MongoDB Community Server from [mongodb.com](https://www.mongodb.com/try/download/community)
2. Install with default settings
3. Start MongoDB service:
   ```cmd
   net start MongoDB
   ```

### macOS
1. Install with Homebrew:
   ```bash
   brew tap mongodb/brew
   brew install mongodb-community
   ```
2. Start MongoDB service:
   ```bash
   brew services start mongodb-community
   ```

### Linux (Ubuntu/Debian)
1. Install MongoDB:
   ```bash
   sudo apt update
   sudo apt install mongodb
   ```
2. Start MongoDB service:
   ```bash
   sudo systemctl start mongod
   sudo systemctl enable mongod
   ```

### Docker (Recommended for Development)
1. Run MongoDB with Docker:
   ```bash
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   ```

## Option 2: MongoDB Atlas (Cloud - Recommended)

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free account
3. Create a new cluster (free tier)
4. Get your connection string
5. Update `.env` file:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/pg_maintenance?retryWrites=true&w=majority
   ```

## Quick Test

After setup, test the connection:
```bash
# Check if MongoDB is running
mongo --eval "db.runCommand('ping')"

# Or with MongoDB Atlas
# The connection will be tested when you start the server
```

## Troubleshooting

### Connection Refused Error
- Make sure MongoDB is running
- Check if port 27017 is available
- For Docker: `docker ps` to see if container is running

### Authentication Error
- For local MongoDB: No authentication needed by default
- For Atlas: Make sure username/password are correct

### Timeout Error
- Check network connection
- Increase timeout in database config if needed
- For Atlas: Check IP whitelist settings 