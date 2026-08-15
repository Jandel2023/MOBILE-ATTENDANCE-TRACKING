import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.btvtc.attendance',
  appName: 'BTVTC Attendance Tracker',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
