import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'io.findfit.app',
  appName: 'FindFit',
  webDir: 'out',
  server: {
    // 개발 시 로컬 서버 사용 (배포 시 제거)
    url: 'http://localhost:3000',
    cleartext: true,
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
}

export default config
