import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.biblevoice.app',
  appName: 'BibleVoice',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  ios: {
    contentInset: 'automatic',
    scrollEnabled: false,
  },
  android: {
    backgroundColor: '#FDF6EC',
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
    StatusBar: {
      style: 'Dark',
      backgroundColor: '#7B1C1C',
      overlaysWebView: false,
    },
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: '#FDF6EC',
      androidSplashResourceName: 'splash',
      showSpinner: false,
    },
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true,
    },
  },
}

export default config
