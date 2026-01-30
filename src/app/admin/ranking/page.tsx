"use client";

import { RankingEditTable } from "../../../components/admin/ranking-edit-table";
import { AddBJForm } from "../../../components/admin/add-bj-form";
import { BJList } from "../../../components/admin/bj-list";
import { AdManagement } from "../../../components/admin/ad-management";
import { AdStatsDashboard } from "../../../components/admin/ad-stats-dashboard";
import { BJRevenueDashboard } from "../../../components/admin/bj-revenue-dashboard";
import { AutoFetchBJsButton } from "../../../components/admin/auto-fetch-bjs-button";

export default function AdminRankingPage() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <div className="space-y-4 order-2 lg:order-1">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="text-base sm:text-lg font-semibold text-zinc-50">BJ 관리</h2>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <AutoFetchBJsButton />
              <AddBJForm onSuccess={() => window.location.reload()} />
            </div>
          </div>
          <BJList />
        </div>
        <div className="space-y-4 order-1 lg:order-2">
          <RankingEditTable />
        </div>
      </div>
      <div className="pt-4 sm:pt-6 border-t border-zinc-800">
        <AdManagement />
      </div>
      <div className="pt-4 sm:pt-6 border-t border-zinc-800">
        <AdStatsDashboard />
      </div>
      <div className="pt-4 sm:pt-6 border-t border-zinc-800">
        <BJRevenueDashboard />
      </div>
    </div>
  );
}

