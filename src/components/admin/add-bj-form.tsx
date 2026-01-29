"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { addBJ } from "../../lib/actions/add-bj";
import { useToast } from "../ui/toast-context";

export function AddBJForm({ onSuccess }: { onSuccess?: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    channelUrl: "",
    thumbnailUrl: "",
    initialScore: "0",
  });
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await addBJ({
        name: formData.name,
        channelUrl: formData.channelUrl,
        thumbnailUrl: formData.thumbnailUrl || undefined,
        initialScore: formData.initialScore ? parseInt(formData.initialScore, 10) : undefined,
      });

      if (result.success) {
        showToast({
          title: "BJ 추가 완료",
          description: result.message,
          variant: "success",
        });
        setFormData({ name: "", channelUrl: "", thumbnailUrl: "", initialScore: "0" });
        setIsOpen(false);
        onSuccess?.();
      } else {
        showToast({
          title: "BJ 추가 실패",
          description: result.error ?? "BJ 추가에 실패했습니다.",
          variant: "error",
        });
      }
    } catch (error) {
      showToast({
        title: "BJ 추가 실패",
        description: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 rounded-full border border-emerald-500/70 bg-emerald-500/20 px-4 py-1.5 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/30 transition"
      >
        <Plus className="h-3.5 w-3.5" />
        <span>BJ 추가</span>
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/80 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-50">새 BJ 추가</h3>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="text-zinc-400 hover:text-zinc-200 transition"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">
            BJ 이름 *
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-50 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/60"
            placeholder="예: 엑셀황제"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">
            채널 URL *
          </label>
          <input
            type="url"
            required
            value={formData.channelUrl}
            onChange={(e) => setFormData({ ...formData, channelUrl: e.target.value })}
            className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-50 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/60"
            placeholder="https://www.youtube.com/@username 또는 https://bj.afreecatv.com/bjid"
          />
          <p className="mt-1 text-[10px] text-zinc-500">
            YouTube, SOOP(아프리카TV), Panda TV URL을 입력하세요. 플랫폼은 자동으로 감지됩니다.
          </p>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">
            썸네일 URL (선택사항)
          </label>
          <input
            type="url"
            value={formData.thumbnailUrl}
            onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
            className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-50 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/60"
            placeholder="https://..."
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">
            초기 점수 (선택사항)
          </label>
          <input
            type="number"
            min="0"
            value={formData.initialScore}
            onChange={(e) => setFormData({ ...formData, initialScore: e.target.value })}
            className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-50 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/60"
            placeholder="0"
          />
        </div>

        <div className="flex items-center gap-2 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 rounded-full border border-amber-500/70 bg-amber-500/20 px-4 py-2 text-xs font-semibold text-amber-200 hover:bg-amber-500/30 disabled:opacity-60 transition"
          >
            {loading ? "추가 중..." : "BJ 추가"}
          </button>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="rounded-full border border-zinc-700 bg-zinc-900 px-4 py-2 text-xs font-medium text-zinc-400 hover:bg-zinc-800 transition"
          >
            취소
          </button>
        </div>
      </form>
    </div>
  );
}
