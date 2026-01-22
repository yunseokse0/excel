import { create } from "zustand";
import type { RankingEntry } from "../types/bj";
import { mockRanking } from "../data/mock-bj";

interface LiveRankingState {
  ranking: RankingEntry[];
  loading: boolean;
  usingMock: boolean;
  setRanking: (ranking: RankingEntry[], usingMock: boolean) => void;
  setLoading: (loading: boolean) => void;
}

export const useLiveRankingStore = create<LiveRankingState>((set) => ({
  ranking: mockRanking,
  loading: true,
  usingMock: true,
  setRanking: (ranking, usingMock) => set({ ranking, usingMock }),
  setLoading: (loading) => set({ loading }),
}));

