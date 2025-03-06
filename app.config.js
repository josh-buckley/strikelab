// Additional app configuration settings
import { ConfigContext, ExpoConfig } from '@expo/config';

export default ({ config }) => {
  // Read the existing app.json configuration
  const existingConfig = config;
  
  // Extend with additional splash screen settings
  return {
    ...existingConfig,
    // Ensure splash settings are comprehensive
    splash: {
      image: './assets/images/splash-logo.png',
      imageResizeMode: 'contain',
      resizeMode: 'contain',
      backgroundColor: '#1c1c1e'
    },
    ios: {
      ...existingConfig.ios,
      splash: {
        image: './assets/images/splash-logo.png',
        imageResizeMode: 'contain',
        resizeMode: 'contain',
        backgroundColor: '#1c1c1e',
        dark: {
          image: './assets/images/splash-logo.png',
          resizeMode: 'contain',
          backgroundColor: '#1c1c1e'
        }
      }
    },
    android: {
      ...existingConfig.android,
      splash: {
        image: './assets/images/splash-logo.png',
        imageResizeMode: 'contain',
        resizeMode: 'contain',
        backgroundColor: '#1c1c1e',
        dark: {
          image: './assets/images/splash-logo.png',
          resizeMode: 'contain',
          backgroundColor: '#1c1c1e'
        }
      }
    }
  };
}; 