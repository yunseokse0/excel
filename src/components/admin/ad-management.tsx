"use client";

import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Eye, EyeOff } from "lucide-react";
import {
  getAllAds,
  createAd,
  updateAd,
  deleteAd,
} from "../../lib/actions/ad-management";
import { useToast } from "../ui/toast-context";
import type { Ad, AdType } from "../../types/ad";

export function AdManagement() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  const [formData, setFormData] = useState({
    type: "top_banner" as AdType,
    title: "",
    imageUrl: "",
    linkUrl: "",
    isActive: true,
    startDate: "",
    endDate: "",
    displayOrder: "0",
    cpm: "",
    cpc: "",
    abTestGroup: "",
    abTestVariant: "A" as "A" | "B",
    abTestWeight: "50",
    targetPages: "",
    targetUserGroups: "",
    scheduleDays: [] as number[],
    scheduleStartTime: "",
    scheduleEndTime: "",
    timezone: "Asia/Seoul",
  });
  const [uploading, setUploading] = useState(false);
  const { showToast } = useToast();

  const loadAds = async () => {
    setLoading(true);
    const result = await getAllAds();
    if (result.success) {
      setAds(result.ads as any[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    void loadAds();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = editingAd
      ? await updateAd(editingAd.id, {
          type: formData.type,
          title: formData.title || undefined,
          imageUrl: formData.imageUrl,
          linkUrl: formData.linkUrl || undefined,
          isActive: formData.isActive,
          startDate: formData.startDate || undefined,
          endDate: formData.endDate || undefined,
          displayOrder: parseInt(formData.displayOrder, 10),
          cpm: formData.cpm ? parseFloat(formData.cpm) : undefined,
          cpc: formData.cpc ? parseFloat(formData.cpc) : undefined,
          abTestGroup: formData.abTestGroup || undefined,
          abTestVariant: formData.abTestVariant,
          abTestWeight: parseInt(formData.abTestWeight, 10),
          targetPages: formData.targetPages
            ? formData.targetPages.split(",").map((p) => p.trim()).filter(Boolean)
            : undefined,
          targetUserGroups: formData.targetUserGroups
            ? formData.targetUserGroups.split(",").map((g) => g.trim()).filter(Boolean)
            : undefined,
          scheduleDays: formData.scheduleDays.length > 0 ? formData.scheduleDays : undefined,
          scheduleStartTime: formData.scheduleStartTime || undefined,
          scheduleEndTime: formData.scheduleEndTime || undefined,
          timezone: formData.timezone,
        })
      : await createAd({
          type: formData.type,
          title: formData.title || undefined,
          imageUrl: formData.imageUrl,
          linkUrl: formData.linkUrl || undefined,
          isActive: formData.isActive,
          startDate: formData.startDate || undefined,
          endDate: formData.endDate || undefined,
          displayOrder: parseInt(formData.displayOrder, 10),
          cpm: formData.cpm ? parseFloat(formData.cpm) : undefined,
          cpc: formData.cpc ? parseFloat(formData.cpc) : undefined,
          abTestGroup: formData.abTestGroup || undefined,
          abTestVariant: formData.abTestVariant,
          abTestWeight: parseInt(formData.abTestWeight, 10),
          targetPages: formData.targetPages
            ? formData.targetPages.split(",").map((p) => p.trim()).filter(Boolean)
            : undefined,
          targetUserGroups: formData.targetUserGroups
            ? formData.targetUserGroups.split(",").map((g) => g.trim()).filter(Boolean)
            : undefined,
          scheduleDays: formData.scheduleDays.length > 0 ? formData.scheduleDays : undefined,
          scheduleStartTime: formData.scheduleStartTime || undefined,
          scheduleEndTime: formData.scheduleEndTime || undefined,
          timezone: formData.timezone,
        });

    if (result.success) {
      showToast({
        title: editingAd ? "광고 수정 완료" : "광고 추가 완료",
        variant: "success",
      });
      setIsFormOpen(false);
      setEditingAd(null);
      setFormData({
        type: "top_banner",
        title: "",
        imageUrl: "",
        linkUrl: "",
        isActive: true,
        startDate: "",
        endDate: "",
      displayOrder: "0",
      cpm: "",
      cpc: "",
      abTestGroup: "",
      abTestVariant: "A",
      abTestWeight: "50",
        targetPages: "",
        targetUserGroups: "",
        scheduleDays: [],
        scheduleStartTime: "",
        scheduleEndTime: "",
        timezone: "Asia/Seoul",
      });
      void loadAds();
    } else {
      showToast({
        title: "오류",
        description: result.error,
        variant: "error",
      });
    }
  };

  const handleEdit = (ad: Ad) => {
    setEditingAd(ad);
    setFormData({
      type: ad.type,
      title: ad.title || "",
      imageUrl: ad.imageUrl,
      linkUrl: ad.linkUrl || "",
      isActive: ad.isActive,
      startDate: ad.startDate ? ad.startDate.split("T")[0] : "",
      endDate: ad.endDate ? ad.endDate.split("T")[0] : "",
      displayOrder: ad.displayOrder.toString(),
      cpm: ad.cpm?.toString() || "",
      cpc: ad.cpc?.toString() || "",
      abTestGroup: ad.abTestGroup || "",
      abTestVariant: ad.abTestVariant || "A",
      abTestWeight: ad.abTestWeight?.toString() || "50",
      targetPages: ad.targetPages?.join(", ") || "",
      targetUserGroups: ad.targetUserGroups?.join(", ") || "",
      scheduleDays: ad.scheduleDays || [],
      scheduleStartTime: ad.scheduleStartTime || "",
      scheduleEndTime: ad.scheduleEndTime || "",
      timezone: ad.timezone || "Asia/Seoul",
    });
    setIsFormOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast({
        title: "오류",
        description: "이미지 파일만 업로드 가능합니다.",
        variant: "error",
      });
      return;
    }

    setUploading(true);
    const formDataToUpload = new FormData();
    formDataToUpload.append("file", file);

    try {
      const res = await fetch("/api/ad/upload", {
        method: "POST",
        body: formDataToUpload,
      });

      const data = await res.json();

      if (data.success) {
        setFormData({ ...formData, imageUrl: data.url });
        showToast({
          title: "이미지 업로드 완료",
          variant: "success",
        });
      } else {
        showToast({
          title: "업로드 실패",
          description: data.error,
          variant: "error",
        });
      }
    } catch (error) {
      showToast({
        title: "업로드 실패",
        description: error instanceof Error ? error.message : "알 수 없는 오류",
        variant: "error",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (adId: string) => {
    if (!confirm("정말로 이 광고를 삭제하시겠습니까?")) return;

    const result = await deleteAd(adId);
    if (result.success) {
      showToast({ title: "광고 삭제 완료", variant: "success" });
      void loadAds();
    } else {
      showToast({ title: "삭제 실패", description: result.error, variant: "error" });
    }
  };

  const handleToggleActive = async (ad: Ad) => {
    const result = await updateAd(ad.id, { isActive: !ad.isActive });
    if (result.success) {
      void loadAds();
    }
  };

  const typeLabels: Record<AdType, string> = {
    top_banner: "상단 배너",
    popup: "팝업",
    bottom_banner: "하단 배너",
  };

  if (loading) {
    return <div className="text-sm text-zinc-500">광고 목록을 불러오는 중...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-50">광고 관리</h2>
        <button
          onClick={() => {
            setIsFormOpen(true);
            setEditingAd(null);
            setFormData({
              type: "top_banner",
              title: "",
              imageUrl: "",
              linkUrl: "",
              isActive: true,
              startDate: "",
              endDate: "",
      displayOrder: "0",
      cpm: "",
      cpc: "",
      abTestGroup: "",
      abTestVariant: "A",
      abTestWeight: "50",
              targetPages: "",
              targetUserGroups: "",
              scheduleDays: [],
              scheduleStartTime: "",
              scheduleEndTime: "",
              timezone: "Asia/Seoul",
            });
          }}
          className="inline-flex items-center gap-2 rounded-full border border-emerald-500/70 bg-emerald-500/20 px-4 py-1.5 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/30 transition"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>광고 추가</span>
        </button>
      </div>

      {isFormOpen && (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-zinc-800/80 bg-zinc-950/80 p-4 space-y-3"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                광고 타입 *
              </label>
              <select
                required
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value as AdType })
                }
                className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-50 outline-none focus:border-amber-500"
              >
                <option value="top_banner">상단 배너</option>
                <option value="popup">팝업</option>
                <option value="bottom_banner">하단 배너</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                표시 순서
              </label>
              <input
                type="number"
                value={formData.displayOrder}
                onChange={(e) =>
                  setFormData({ ...formData, displayOrder: e.target.value })
                }
                className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-50 outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              이미지 *
            </label>
            <div className="flex gap-2">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className={`flex-1 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-50 text-center cursor-pointer hover:bg-zinc-800 transition ${
                  uploading ? "opacity-60 cursor-not-allowed" : ""
                }`}
              >
                {uploading ? "업로드 중..." : "이미지 업로드"}
              </label>
              <input
                type="url"
                required
                value={formData.imageUrl}
                onChange={(e) =>
                  setFormData({ ...formData, imageUrl: e.target.value })
                }
                className="flex-[2] rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-50 outline-none focus:border-amber-500"
                placeholder="또는 이미지 URL 입력"
              />
            </div>
            {formData.imageUrl && (
              <img
                src={formData.imageUrl}
                alt="미리보기"
                className="mt-2 max-h-32 w-auto rounded-md border border-zinc-700"
              />
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              링크 URL (선택사항)
            </label>
            <input
              type="url"
              value={formData.linkUrl}
              onChange={(e) =>
                setFormData({ ...formData, linkUrl: e.target.value })
              }
              className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-50 outline-none focus:border-amber-500"
              placeholder="https://..."
            />
          </div>

          {/* 수익 설정 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                CPM (천 노출당 비용, 원)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.cpm}
                onChange={(e) =>
                  setFormData({ ...formData, cpm: e.target.value })
                }
                className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-50 outline-none focus:border-amber-500"
                placeholder="예: 1000"
              />
              <p className="text-[10px] text-zinc-500 mt-1">
                노출 기반 수익 계산
              </p>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                CPC (클릭당 비용, 원)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.cpc}
                onChange={(e) =>
                  setFormData({ ...formData, cpc: e.target.value })
                }
                className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-50 outline-none focus:border-amber-500"
                placeholder="예: 50"
              />
              <p className="text-[10px] text-zinc-500 mt-1">
                클릭 기반 수익 계산
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              제목 (선택사항)
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-50 outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                시작일 (선택사항)
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
                className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-50 outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                종료일 (선택사항)
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
                className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-50 outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) =>
                setFormData({ ...formData, isActive: e.target.checked })
              }
              className="rounded border-zinc-700"
            />
            <label htmlFor="isActive" className="text-xs text-zinc-400">
              활성화
            </label>
          </div>

          {/* A/B 테스트 설정 */}
          <div className="pt-4 border-t border-zinc-800/70">
            <h4 className="text-xs font-semibold text-zinc-300 mb-3">A/B 테스트 설정</h4>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  테스트 그룹 ID
                </label>
                <input
                  type="text"
                  value={formData.abTestGroup}
                  onChange={(e) =>
                    setFormData({ ...formData, abTestGroup: e.target.value })
                  }
                  className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-50 outline-none focus:border-amber-500"
                  placeholder="예: test-001"
                />
                <p className="mt-1 text-[10px] text-zinc-500">
                  같은 그룹 ID를 가진 광고들은 함께 테스트됩니다.
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  변형 (A/B)
                </label>
                <select
                  value={formData.abTestVariant}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      abTestVariant: e.target.value as "A" | "B",
                    })
                  }
                  className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-50 outline-none focus:border-amber-500"
                >
                  <option value="A">A</option>
                  <option value="B">B</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  가중치 (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.abTestWeight}
                  onChange={(e) =>
                    setFormData({ ...formData, abTestWeight: e.target.value })
                  }
                  className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-50 outline-none focus:border-amber-500"
                />
                <p className="mt-1 text-[10px] text-zinc-500">
                  표시 비율 (기본: 50%)
                </p>
              </div>
            </div>
          </div>

          {/* 타겟팅 설정 */}
          <div className="pt-4 border-t border-zinc-800/70">
            <h4 className="text-xs font-semibold text-zinc-300 mb-3">타겟팅 설정</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  표시할 페이지 경로 (쉼표로 구분)
                </label>
                <input
                  type="text"
                  value={formData.targetPages}
                  onChange={(e) =>
                    setFormData({ ...formData, targetPages: e.target.value })
                  }
                  className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-50 outline-none focus:border-amber-500"
                  placeholder="예: /, /ranking, /live"
                />
                <p className="mt-1 text-[10px] text-zinc-500">
                  비어있으면 모든 페이지에 표시됩니다.
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  타겟 사용자 그룹 (쉼표로 구분)
                </label>
                <input
                  type="text"
                  value={formData.targetUserGroups}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      targetUserGroups: e.target.value,
                    })
                  }
                  className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-50 outline-none focus:border-amber-500"
                  placeholder="예: new, returning, vip"
                />
                <p className="mt-1 text-[10px] text-zinc-500">
                  비어있으면 모든 사용자에게 표시됩니다.
                </p>
              </div>
            </div>
          </div>

          {/* 스케줄링 설정 */}
          <div className="pt-4 border-t border-zinc-800/70">
            <h4 className="text-xs font-semibold text-zinc-300 mb-3">스케줄링 설정</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  표시 요일 (복수 선택 가능)
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 0, label: "일" },
                    { value: 1, label: "월" },
                    { value: 2, label: "화" },
                    { value: 3, label: "수" },
                    { value: 4, label: "목" },
                    { value: 5, label: "금" },
                    { value: 6, label: "토" },
                  ].map((day) => (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => {
                        const newDays = formData.scheduleDays.includes(day.value)
                          ? formData.scheduleDays.filter((d) => d !== day.value)
                          : [...formData.scheduleDays, day.value];
                        setFormData({ ...formData, scheduleDays: newDays });
                      }}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                        formData.scheduleDays.includes(day.value)
                          ? "bg-amber-500/20 border border-amber-500/70 text-amber-200"
                          : "bg-zinc-900 border border-zinc-700 text-zinc-400 hover:bg-zinc-800"
                      }`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
                <p className="mt-1 text-[10px] text-zinc-500">
                  비어있으면 모든 요일에 표시됩니다.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                    시작 시간
                  </label>
                  <input
                    type="time"
                    value={formData.scheduleStartTime}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        scheduleStartTime: e.target.value,
                      })
                    }
                    className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-50 outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                    종료 시간
                  </label>
                  <input
                    type="time"
                    value={formData.scheduleEndTime}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        scheduleEndTime: e.target.value,
                      })
                    }
                    className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-50 outline-none focus:border-amber-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  타임존
                </label>
                <select
                  value={formData.timezone}
                  onChange={(e) =>
                    setFormData({ ...formData, timezone: e.target.value })
                  }
                  className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-50 outline-none focus:border-amber-500"
                >
                  <option value="Asia/Seoul">Asia/Seoul (한국)</option>
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">America/New_York (미국 동부)</option>
                  <option value="Europe/London">Europe/London (영국)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              className="flex-1 rounded-full border border-amber-500/70 bg-amber-500/20 px-4 py-2 text-xs font-semibold text-amber-200 hover:bg-amber-500/30"
            >
              {editingAd ? "수정" : "추가"}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsFormOpen(false);
                setEditingAd(null);
              }}
              className="rounded-full border border-zinc-700 bg-zinc-900 px-4 py-2 text-xs font-medium text-zinc-400 hover:bg-zinc-800"
            >
              취소
            </button>
          </div>
        </form>
      )}

      <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/80 overflow-hidden">
        <div className="divide-y divide-zinc-800/70">
          {ads.map((ad) => (
            <div
              key={ad.id}
              className="p-4 flex items-center justify-between gap-4 hover:bg-zinc-900/50"
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <img
                  src={ad.imageUrl}
                  alt={ad.title || "광고"}
                  className="w-20 h-12 object-cover rounded-lg flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-amber-300">
                      {typeLabels[ad.type]}
                    </span>
                    {ad.isActive ? (
                      <span className="text-[10px] text-emerald-400">활성</span>
                    ) : (
                      <span className="text-[10px] text-zinc-500">비활성</span>
                    )}
                  </div>
                  {ad.title && (
                    <p className="text-sm text-zinc-300 mt-0.5">{ad.title}</p>
                  )}
                  <p className="text-[10px] text-zinc-500 mt-1">
                    클릭 수: {ad.clickCount} | 순서: {ad.displayOrder}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleToggleActive(ad)}
                  className="text-zinc-400 hover:text-zinc-200"
                >
                  {ad.isActive ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
                <button
                  onClick={() => handleEdit(ad)}
                  className="text-zinc-400 hover:text-blue-400"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(ad.id)}
                  className="text-zinc-400 hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
        {ads.length === 0 && (
          <div className="p-8 text-center text-sm text-zinc-500">
            등록된 광고가 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}
