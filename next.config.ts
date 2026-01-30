import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 프로덕션에서 브라우저 소스맵 비활성화 (소스 코드 노출 방지)
  productionBrowserSourceMaps: false,
  
  // 컴파일러 옵션: 소스맵 비활성화
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      // 프로덕션 빌드에서 클라이언트 사이드 소스맵 비활성화
      config.devtool = false;
    }
    return config;
  },
  
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
