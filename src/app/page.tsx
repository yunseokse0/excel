import { mockBJs, mockLives, mockRanking } from "../data/mock-bj";
import { HeroCarousel } from "../components/hero-carousel";
import { LiveGrid } from "../components/live-grid";
import { MiniRankingBoard } from "../components/mini-ranking-board";

export default function HomePage() {
  const liveRanking = mockRanking.slice(0, 5);
  const liveList = mockLives.slice(0, 8);
  const featured = mockLives[0] ?? null;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,2.2fr)_minmax(260px,1fr)]">
      <section className="space-y-6">
        <HeroCarousel featured={featured} allLives={mockLives} />
        <LiveGrid lives={liveList} />
      </section>

      <aside className="space-y-4">
        <MiniRankingBoard ranking={liveRanking} />
      </aside>
    </div>
  );
}
