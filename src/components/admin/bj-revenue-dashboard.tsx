"use client";

import { useEffect, useState } from "react";
import { DollarSign, TrendingUp, Users } from "lucide-react";
import { getAllBJRevenue } from "../../lib/actions/bj-revenue";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface BJRevenue {
  bjId: string;
  bjName: string;
  platform: string;
  donationRevenue: number;
  superchatRevenue: number;
  totalRevenue: number;
}

export function BJRevenueDashboard() {
  const [revenue, setRevenue] = useState<BJRevenue[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRevenue = async () => {
    setLoading(true);
    const result = await getAllBJRevenue();
    if (result.success && result.revenue) {
      // 후원 데이터가 있는 항목만 필터링 (도네이션 또는 슈퍼챗이 0보다 큰 경우만)
      const validRevenue = result.revenue.filter(
        (r: BJRevenue) => (r.donationRevenue > 0 || r.superchatRevenue > 0)
      );
      setRevenue(validRevenue);
      
      if (validRevenue.length === 0 && result.revenue.length > 0) {
        console.warn("[BJ Revenue] ⚠️ No revenue data available. All entries have zero revenue.");
      }
    } else {
      // 에러 발생 시 빈 배열로 설정하여 화면에 표시하지 않음
      console.error("Failed to load BJ revenue:", result.error);
      setRevenue([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    void loadRevenue();
  }, []);

  if (loading) {
    return (
      <div className="text-sm text-zinc-500 text-center py-8">
        수익 데이터를 불러오는 중...
      </div>
    );
  }

  // 후원 데이터가 없으면 화면에 표시하지 않음
  if (revenue.length === 0) {
    return null;
  }

  const totalDonation = revenue.reduce(
    (sum, r) => sum + r.donationRevenue,
    0
  );
  const totalSuperchat = revenue.reduce(
    (sum, r) => sum + r.superchatRevenue,
    0
  );
  const totalRevenue = revenue.reduce((sum, r) => sum + r.totalRevenue, 0);

  const chartData = {
    labels: revenue.map((r) => r.bjName),
    datasets: [
      {
        label: "도네이션 (원)",
        data: revenue.map((r) => r.donationRevenue),
        backgroundColor: "rgba(34, 197, 94, 0.5)",
        borderColor: "rgba(34, 197, 94, 1)",
        borderWidth: 1,
      },
      {
        label: "슈퍼챗 (원)",
        data: revenue.map((r) => r.superchatRevenue),
        backgroundColor: "rgba(59, 130, 246, 0.5)",
        borderColor: "rgba(59, 130, 246, 1)",
        borderWidth: 1,
      },
    ],
  };

  // 후원 데이터가 없으면 화면에 표시하지 않음
  if (!loading && revenue.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-50">
          BJ 수익 통계 대시보드
        </h2>
        <p className="text-sm text-zinc-400 mt-1">
          BJ별 도네이션 및 슈퍼챗 수익을 확인할 수 있습니다.
        </p>
      </div>

      {/* 전체 통계 요약 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/80 p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-medium text-zinc-400">총 도네이션</span>
          </div>
          <p className="text-2xl font-bold text-emerald-300">
            ₩{totalDonation.toLocaleString()}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/80 p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-blue-400" />
            <span className="text-xs font-medium text-zinc-400">총 슈퍼챗</span>
          </div>
          <p className="text-2xl font-bold text-blue-300">
            ₩{totalSuperchat.toLocaleString()}
          </p>
        </div>

        <div className="rounded-2xl border border-amber-500/50 bg-amber-500/10 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-amber-400" />
            <span className="text-xs font-medium text-zinc-400">총 수익</span>
          </div>
          <p className="text-2xl font-bold text-amber-300">
            ₩{totalRevenue.toLocaleString()}
          </p>
        </div>
      </div>

      {/* 차트 */}
      {revenue.length > 0 && (
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/80 p-4">
          <h3 className="text-sm font-semibold text-zinc-50 mb-4">
            BJ별 수익 비교
          </h3>
          <Bar
            data={chartData}
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
                  callbacks: {
                    label: (context) => {
                      return `${context.dataset.label}: ₩${Number(context.parsed.y).toLocaleString()}`;
                    },
                  },
                },
              },
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    color: "#a1a1aa",
                    callback: (value) => `₩${Number(value).toLocaleString()}`,
                  },
                  grid: { color: "rgba(255, 255, 255, 0.1)" },
                },
                x: {
                  ticks: { color: "#a1a1aa", maxRotation: 45 },
                  grid: { display: false },
                },
              },
            }}
            height={300}
          />
        </div>
      )}

      {/* 수익 테이블 */}
      <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/80 overflow-hidden">
        <div className="p-4 border-b border-zinc-800/70">
          <h3 className="text-sm font-semibold text-zinc-50">BJ별 수익 상세</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-zinc-900/90 border-b border-zinc-800/80">
              <tr className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                <th className="px-4 py-3 text-left">BJ</th>
                <th className="px-4 py-3 text-right">도네이션</th>
                <th className="px-4 py-3 text-right">슈퍼챗</th>
                <th className="px-4 py-3 text-right">총 수익</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/70">
              {revenue.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-6 text-center text-xs text-zinc-500"
                  >
                    수익 데이터가 없습니다.
                  </td>
                </tr>
              ) : (
                revenue.map((r) => (
                  <tr
                    key={r.bjId}
                    className="text-xs text-zinc-200 hover:bg-zinc-900/50"
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{r.bjName}</p>
                        <p className="text-[10px] text-zinc-500">
                          {r.platform === "youtube" ? "YouTube" : "Unknown"}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-semibold text-emerald-400">
                        ₩{r.donationRevenue.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-semibold text-blue-400">
                        ₩{r.superchatRevenue.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-semibold text-amber-400">
                        ₩{r.totalRevenue.toLocaleString()}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
