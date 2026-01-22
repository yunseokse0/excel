import { mockLives } from "../../data/mock-bj";
import { LiveGrid } from "../../components/live-grid";

export default function LivePage() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
          전체 라이브 목록
        </h1>
        <p className="text-sm text-zinc-400">
          현재 방송 중인 모든 BJ를 플랫폼 구분 없이 한눈에 볼 수 있습니다.
        </p>
      </header>
      <LiveGrid lives={mockLives} />
    </div>
  );
}

