import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Determine the correct API URL based on platform
const getApiUrl = () => {
  switch (Platform.OS) {
    case 'ios':
      return 'http://localhost:5000/api';
    case 'android':
      return 'http:192.168.0.3:5000/api'; // Android emulator
    default:
      return 'http://192.168.0.3:5000/api'; // Fallback to local IP
  }
};

const ENV = {
  development: {
    apiUrl: getApiUrl(),
  },
  staging: {
    apiUrl: 'https://staging-api.yourdomain.com/api',
  },
  production: {
    apiUrl: 'https://api.yourdomain.com/api',
  },
};

// Determine the current environment
const getEnvVars = (env = Constants.manifest?.releaseChannel) => {
  console.log('Current environment:', env);
  
  // Default to development if no environment is specified
  if (env === null || env === undefined) {
    console.log('Defaulting to development environment');
    return ENV.development;
  }
  
  switch (env) {
    case 'production':
      return ENV.production;
    case 'staging':
      return ENV.staging;
    default:
      return ENV.development;
  }
};

export const { apiUrl } = getEnvVars();
console.log('Configured API URL:', apiUrl);
