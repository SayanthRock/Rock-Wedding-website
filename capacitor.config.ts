import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.emoments.app',
  appName: 'E. Moments',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
