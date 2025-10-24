import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.piscineiro.app',
  appName: 'Piscineiro App',
  webDir: 'out',
  server: {
    url: 'https://piscineiro-app.vercel.app',
    cleartext: true,
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#0ea5e9",
      showSpinner: false
    }
  }
};

export default config;
