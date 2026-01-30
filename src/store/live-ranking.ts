import { create } from "zustand";
import type { RankingEntry } from "../types/bj";

interface LiveRankingState {
  ranking: RankingEntry[];
  loading: boolean;
  usingMock: boolean;
  setRanking: (ranking: RankingEntry[], usingMock: boolean) => void;
  setLoading: (loading: boolean) => void;
}

export const useLiveRankingStore = create<LiveRankingState>((set) => ({
  ranking: [],
  loading: true,
  usingMock: false,
  setRanking: (ranking, usingMock) => set({ ranking, usingMock }),
  setLoading: (loading) => set({ loading }),
}));

