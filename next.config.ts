import type { NextConfig } from "next";

const isApp = process.env.BUILD_TARGET === 'app'

const nextConfig: NextConfig = {
  // 앱 빌드 시 static export (Capacitor용)
  // 웹 배포는 일반 Next.js 서버 사용
  ...(isApp && { output: 'export' }),
}

export default nextConfig;
