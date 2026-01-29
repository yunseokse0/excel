"use client";

import { useEffect, useState } from "react";
import { Trash2, ExternalLink } from "lucide-react";
import { getAllBJs, deleteBJ } from "../../lib/actions/add-bj";
import { useToast } from "../ui/toast-context";
import { PlatformBadge } from "../platform-badge";

interface BJItem {
  id: string;
  name: string;
  platform: "youtube" | "soop" | "panda";
  channel_url: string;
  thumbnail_url: string | null;
  created_at: string;
}

export function BJList() {
  const [bjs, setBJs] = useState<BJItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { showToast } = useToast();

  const loadBJs = async () => {
    setLoading(true);
    const result = await getAllBJs();
    if (result.success) {
      setBJs(result.bjs as BJItem[]);
    } else {
      showToast({
        title: "BJ 목록 불러오기 실패",
        description: result.error,
        variant: "error",
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    void loadBJs();
  }, []);

  const handleDelete = async (bjId: string, bjName: string) => {
    if (!confirm(`정말로 "${bjName}" BJ를 삭제하시겠습니까?`)) {
      return;
    }

    setDeletingId(bjId);
    const result = await deleteBJ(bjId);
    setDeletingId(null);

    if (result.success) {
      showToast({
        title: "BJ 삭제 완료",
        description: `${bjName} BJ가 삭제되었습니다.`,
        variant: "success",
      });
      void loadBJs();
    } else {
      showToast({
        title: "BJ 삭제 실패",
        description: result.error ?? "BJ 삭제에 실패했습니다.",
        variant: "error",
      });
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/80 p-4">
        <p className="text-sm text-zinc-500 text-center py-4">BJ 목록을 불러오는 중...</p>
      </div>
    );
  }

  if (bjs.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/80 p-4">
        <p className="text-sm text-zinc-500 text-center py-4">등록된 BJ가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/80 overflow-hidden">
      <div className="p-4 border-b border-zinc-800/70">
        <h3 className="text-sm font-semibold text-zinc-50">등록된 BJ 목록 ({bjs.length}개)</h3>
      </div>
      <div className="divide-y divide-zinc-800/70">
        {bjs.map((bj) => (
          <div
            key={bj.id}
            className="p-4 flex items-center justify-between gap-4 hover:bg-zinc-900/50 transition"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {bj.thumbnail_url && (
                <img
                  src={bj.thumbnail_url}
                  alt={bj.name}
                  className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-50 truncate">{bj.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <PlatformBadge platform={bj.platform} />
                  <a
                    href={bj.channel_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-zinc-400 hover:text-amber-300 transition flex items-center gap-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    채널 보기
                  </a>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleDelete(bj.id, bj.name)}
              disabled={deletingId === bj.id}
              className="text-zinc-400 hover:text-red-400 transition disabled:opacity-60 flex-shrink-0"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
