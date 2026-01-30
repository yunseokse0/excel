"use client";

import { useEffect, useState } from "react";
import { BarChart3, TrendingUp, MousePointer, Eye } from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { Bar, Line, Doughnut } from "react-chartjs-2";
import { getAllAdsStats, getAdStatsByDate } from "../../lib/actions/ad-stats";
import { getAllAds } from "../../lib/actions/ad-management";
import type { AdStats, AdStatsByDate } from "../../types/ad";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export function AdStatsDashboard() {
  const [allStats, setAllStats] = useState<AdStats[]>([]);
  const [selectedAdId, setSelectedAdId] = useState<string | null>(null);
  const [dateStats, setDateStats] = useState<AdStatsByDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [ads, setAds] = useState<any[]>([]);
  const [realTimeEnabled, setRealTimeEnabled] = useState(false);

  const loadStats = async () => {
    const statsResult = await getAllAdsStats();
    const adsResult = await getAllAds();

    if (statsResult && adsResult.success) {
      setAllStats(statsResult);
      setAds(adsResult.ads || []);
      if (adsResult.ads && adsResult.ads.length > 0 && !selectedAdId) {
        setSelectedAdId(adsResult.ads[0].id);
      }
    }
  };

  useEffect(() => {
    async function init() {
      setLoading(true);
      await loadStats();
      setLoading(false);
    }
    void init();
  }, []);

  useEffect(() => {
    if (!selectedAdId) return;

    async function loadDateStats() {
      if (!selectedAdId) return; // Type guard
      const endDate = new Date().toISOString();
      const startDate = new Date(
        Date.now() - 30 * 24 * 60 * 60 * 1000
      ).toISOString(); // 최근 30일

      const result = await getAdStatsByDate(selectedAdId, startDate, endDate);
      setDateStats(result);
    }
    void loadDateStats();
  }, [selectedAdId]);

  // 실시간 업데이트 (WebSocket 대신 폴링 사용)
  useEffect(() => {
    if (!realTimeEnabled) return;

    const interval = setInterval(() => {
      void loadStats();
    }, 5000); // 5초마다 업데이트

    return () => clearInterval(interval);
  }, [realTimeEnabled]);

  if (loading) {
    return (
      <div className="text-sm text-zinc-500 text-center py-8">
        통계를 불러오는 중...
      </div>
    );
  }

  const totalImpressions = allStats.reduce(
    (sum, stat) => sum + stat.impressions,
    0
  );
  const totalClicks = allStats.reduce((sum, stat) => sum + stat.clicks, 0);
  const avgCTR =
    totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

  const selectedAd = ads.find((ad) => ad.id === selectedAdId);
  const selectedAdStat = allStats.find((stat) => stat.adId === selectedAdId);

  // 차트 데이터 준비
  const impressionsChartData = {
    labels: allStats.map((stat) => {
      const ad = ads.find((a) => a.id === stat.adId);
      return ad?.title || "제목 없음";
    }),
    datasets: [
      {
        label: "노출 수",
        data: allStats.map((stat) => stat.impressions),
        backgroundColor: "rgba(59, 130, 246, 0.5)",
        borderColor: "rgba(59, 130, 246, 1)",
        borderWidth: 1,
      },
    ],
  };

  const clicksChartData = {
    labels: allStats.map((stat) => {
      const ad = ads.find((a) => a.id === stat.adId);
      return ad?.title || "제목 없음";
    }),
    datasets: [
      {
        label: "클릭 수",
        data: allStats.map((stat) => stat.clicks),
        backgroundColor: "rgba(34, 197, 94, 0.5)",
        borderColor: "rgba(34, 197, 94, 1)",
        borderWidth: 1,
      },
    ],
  };

  const ctrChartData = {
    labels: allStats.map((stat) => {
      const ad = ads.find((a) => a.id === stat.adId);
      return ad?.title || "제목 없음";
    }),
    datasets: [
      {
        label: "CTR (%)",
        data: allStats.map((stat) => stat.ctr),
        backgroundColor: "rgba(250, 204, 21, 0.5)",
        borderColor: "rgba(250, 204, 21, 1)",
        borderWidth: 1,
      },
    ],
  };

  const dateStatsChartData = {
    labels: dateStats.map((stat) => stat.date),
    datasets: [
      {
        label: "노출 수",
        data: dateStats.map((stat) => stat.impressions),
        borderColor: "rgba(59, 130, 246, 1)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        tension: 0.4,
      },
      {
        label: "클릭 수",
        data: dateStats.map((stat) => stat.clicks),
        borderColor: "rgba(34, 197, 94, 1)",
        backgroundColor: "rgba(34, 197, 94, 0.1)",
        tension: 0.4,
      },
    ],
  };

  const ctrDistributionData = {
    labels: ["0-1%", "1-2%", "2-3%", "3%+"],
    datasets: [
      {
        data: [
          allStats.filter((s) => s.ctr < 1).length,
          allStats.filter((s) => s.ctr >= 1 && s.ctr < 2).length,
          allStats.filter((s) => s.ctr >= 2 && s.ctr < 3).length,
          allStats.filter((s) => s.ctr >= 3).length,
        ],
        backgroundColor: [
          "rgba(239, 68, 68, 0.5)",
          "rgba(250, 204, 21, 0.5)",
          "rgba(34, 197, 94, 0.5)",
          "rgba(59, 130, 246, 0.5)",
        ],
        borderColor: [
          "rgba(239, 68, 68, 1)",
          "rgba(250, 204, 21, 1)",
          "rgba(34, 197, 94, 1)",
          "rgba(59, 130, 246, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-50">
            광고 통계 대시보드
          </h2>
          <p className="text-sm text-zinc-400 mt-1">
            전체 광고의 노출 수, 클릭률 등을 확인할 수 있습니다.
          </p>
        </div>
        <button
          onClick={() => {
            setRealTimeEnabled(!realTimeEnabled);
            if (!realTimeEnabled) {
              void loadStats();
            }
          }}
          className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
            realTimeEnabled
              ? "border-green-500/70 bg-green-500/20 text-green-200"
              : "border-zinc-700 bg-zinc-900 text-zinc-400"
          }`}
        >
          {realTimeEnabled ? "실시간 ON" : "실시간 OFF"}
        </button>
      </div>

      {/* 전체 통계 요약 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/80 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="h-4 w-4 text-blue-400" />
            <span className="text-xs font-medium text-zinc-400">총 노출 수</span>
          </div>
          <p className="text-2xl font-bold text-zinc-50">
            {totalImpressions.toLocaleString()}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/80 p-4">
          <div className="flex items-center gap-2 mb-2">
            <MousePointer className="h-4 w-4 text-green-400" />
            <span className="text-xs font-medium text-zinc-400">총 클릭 수</span>
          </div>
          <p className="text-2xl font-bold text-zinc-50">
            {totalClicks.toLocaleString()}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/80 p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-amber-400" />
            <span className="text-xs font-medium text-zinc-400">평균 CTR</span>
          </div>
          <p className="text-2xl font-bold text-zinc-50">
            {avgCTR.toFixed(2)}%
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-500/50 bg-emerald-500/10 p-4">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-medium text-zinc-400">총 수익</span>
          </div>
          <p className="text-2xl font-bold text-emerald-300">
            ₩{allStats.reduce((sum, stat) => sum + (stat.revenue || 0), 0).toLocaleString()}
          </p>
          <p className="text-[10px] text-zinc-500 mt-1">
            CPM/CPC 기반 계산
          </p>
        </div>
      </div>

      {/* 차트 섹션 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/80 p-4">
          <h3 className="text-sm font-semibold text-zinc-50 mb-4">
            노출 수 비교
          </h3>
          <Bar
            data={impressionsChartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
                tooltip: {
                  backgroundColor: "rgba(0, 0, 0, 0.8)",
                  titleColor: "#fff",
                  bodyColor: "#fff",
                },
              },
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: { color: "#a1a1aa" },
                  grid: { color: "rgba(255, 255, 255, 0.1)" },
                },
                x: {
                  ticks: { color: "#a1a1aa", maxRotation: 45 },
                  grid: { display: false },
                },
              },
            }}
            height={200}
          />
        </div>

        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/80 p-4">
          <h3 className="text-sm font-semibold text-zinc-50 mb-4">
            클릭 수 비교
          </h3>
          <Bar
            data={clicksChartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
                tooltip: {
                  backgroundColor: "rgba(0, 0, 0, 0.8)",
                  titleColor: "#fff",
                  bodyColor: "#fff",
                },
              },
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: { color: "#a1a1aa" },
                  grid: { color: "rgba(255, 255, 255, 0.1)" },
                },
                x: {
                  ticks: { color: "#a1a1aa", maxRotation: 45 },
                  grid: { display: false },
                },
              },
            }}
            height={200}
          />
        </div>

        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/80 p-4">
          <h3 className="text-sm font-semibold text-zinc-50 mb-4">
            CTR 비교
          </h3>
          <Bar
            data={ctrChartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
                tooltip: {
                  backgroundColor: "rgba(0, 0, 0, 0.8)",
                  titleColor: "#fff",
                  bodyColor: "#fff",
                },
              },
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: { color: "#a1a1aa", callback: (value) => `${value}%` },
                  grid: { color: "rgba(255, 255, 255, 0.1)" },
                },
                x: {
                  ticks: { color: "#a1a1aa", maxRotation: 45 },
                  grid: { display: false },
                },
              },
            }}
            height={200}
          />
        </div>

        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/80 p-4">
          <h3 className="text-sm font-semibold text-zinc-50 mb-4">
            CTR 분포
          </h3>
          <Doughnut
            data={ctrDistributionData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: "bottom",
                  labels: { color: "#a1a1aa", font: { size: 10 } },
                },
                tooltip: {
                  backgroundColor: "rgba(0, 0, 0, 0.8)",
                  titleColor: "#fff",
                  bodyColor: "#fff",
                },
              },
            }}
            height={200}
          />
        </div>
      </div>

      {/* 선택된 광고의 날짜별 통계 */}
      {selectedAdId && selectedAdStat && dateStats.length > 0 && (
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/80 p-4">
          <h3 className="text-sm font-semibold text-zinc-50 mb-4">
            {selectedAd?.title || "선택된 광고"} - 최근 30일 트렌드
          </h3>
          <Line
            data={dateStatsChartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  labels: { color: "#a1a1aa", font: { size: 12 } },
                },
                tooltip: {
                  backgroundColor: "rgba(0, 0, 0, 0.8)",
                  titleColor: "#fff",
                  bodyColor: "#fff",
                },
              },
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: { color: "#a1a1aa" },
                  grid: { color: "rgba(255, 255, 255, 0.1)" },
                },
                x: {
                  ticks: { color: "#a1a1aa" },
                  grid: { color: "rgba(255, 255, 255, 0.1)" },
                },
              },
            }}
            height={250}
          />
        </div>
      )}

      {/* 광고별 통계 테이블 */}
      <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/80 overflow-hidden">
        <div className="p-4 border-b border-zinc-800/70">
          <h3 className="text-sm font-semibold text-zinc-50">광고별 통계</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-zinc-900/90 border-b border-zinc-800/80">
              <tr className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                <th className="px-4 py-3 text-left">광고</th>
                <th className="px-4 py-3 text-right">노출 수</th>
                <th className="px-4 py-3 text-right">클릭 수</th>
                <th className="px-4 py-3 text-right">CTR</th>
                <th className="px-4 py-3 text-right">수익</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/70">
              {allStats.map((stat) => {
                const ad = ads.find((a) => a.id === stat.adId);
                return (
                  <tr
                    key={stat.adId}
                    className={`text-xs text-zinc-200 hover:bg-zinc-900/50 cursor-pointer ${
                      selectedAdId === stat.adId ? "bg-zinc-900/70" : ""
                    }`}
                    onClick={() => setSelectedAdId(stat.adId)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {ad?.image_url && (
                          <img
                            src={ad.image_url}
                            alt={ad.title || "광고"}
                            className="w-10 h-6 object-cover rounded"
                          />
                        )}
                        <div>
                          <p className="font-medium">{ad?.title || "제목 없음"}</p>
                          <p className="text-[10px] text-zinc-500">
                            {ad?.type === "top_banner"
                              ? "상단 배너"
                              : ad?.type === "popup"
                              ? "팝업"
                              : "하단 배너"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {stat.impressions.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {stat.clicks.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`font-semibold ${
                          stat.ctr > 2
                            ? "text-green-400"
                            : stat.ctr > 1
                            ? "text-amber-400"
                            : "text-zinc-400"
                        }`}
                      >
                        {stat.ctr.toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-semibold text-emerald-400">
                        {stat.revenue ? `₩${stat.revenue.toLocaleString()}` : "-"}
                      </span>
                      {stat.revenue && (
                        <p className="text-[10px] text-zinc-500 mt-0.5">
                          {stat.cpm ? `CPM: ₩${stat.cpm}` : stat.cpc ? `CPC: ₩${stat.cpc}` : ""}
                        </p>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
