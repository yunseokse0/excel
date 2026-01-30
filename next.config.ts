import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 프로덕션에서 브라우저 소스맵 비활성화 (소스 코드 노출 방지)
  productionBrowserSourceMaps: false,
  
  // Turbopack 설정 (Next.js 16 기본값)
  // webpack 설정 대신 빈 turbopack 설정으로 에러 방지
  turbopack: {},
  
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      {
        protocol: "https",
        hostname: "i.ytimg.com",
      },
      {
        protocol: "https",
        hostname: "**.ytimg.com",
      },
      {
        protocol: "https",
        hostname: "**.afreecatv.com",
      },
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
    ],
  },
};

export default nextConfig;
