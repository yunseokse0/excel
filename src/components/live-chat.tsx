"use client";

import { useState, useRef, useEffect } from "react";
import { Send, User, Edit2, Clock } from "lucide-react";
import { useToast } from "./ui/toast-context";

interface ChatMessage {
  id: string;
  nickname: string;
  message: string;
  timestamp: Date;
  isMine: boolean; // 내가 쓴 메시지인지 (나만 볼 수 있음)
}

interface LiveChatProps {
  bjId: string; // 방송 ID (세션별로 채팅 분리)
}

export function LiveChat({ bjId }: LiveChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [nickname, setNickname] = useState("익명");
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [nicknameInput, setNicknameInput] = useState("익명");
  const [lastNicknameChange, setLastNicknameChange] = useState<number>(0);
  const [myMessageIds, setMyMessageIds] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  // 세션별로 닉네임 저장 (로컬스토리지)
  useEffect(() => {
    const savedNickname = localStorage.getItem(`chat_nickname_${bjId}`);
    if (savedNickname) {
      setNickname(savedNickname);
      setNicknameInput(savedNickname);
    }
  }, [bjId]);

  // 스크롤을 맨 아래로
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 대화명 변경 (30초 쿨타임)
  const handleNicknameChange = () => {
    const now = Date.now();
    const timeSinceLastChange = now - lastNicknameChange;

    if (timeSinceLastChange < 30000) {
      const remainingSeconds = Math.ceil((30000 - timeSinceLastChange) / 1000);
      showToast({
        title: "대화명 변경 대기 중",
        description: `${remainingSeconds}초 후에 변경할 수 있습니다.`,
        variant: "info",
      });
      return;
    }

    const newNickname = nicknameInput.trim() || "익명";
    setNickname(newNickname);
    setLastNicknameChange(now);
    setIsEditingNickname(false);
    localStorage.setItem(`chat_nickname_${bjId}`, newNickname);
    showToast({
      title: "대화명 변경 완료",
      description: `대화명이 "${newNickname}"으로 변경되었습니다.`,
      variant: "success",
    });
  };

  // 메시지 전송
  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newMessage: ChatMessage = {
      id: messageId,
      nickname,
      message: inputMessage.trim(),
      timestamp: new Date(),
      isMine: true,
    };

    // 내 메시지 ID 저장 (나만 볼 수 있게)
    setMyMessageIds((prev) => new Set(prev).add(messageId));

    // 메시지 추가 (로컬 상태만)
    setMessages((prev) => [...prev, newMessage]);
    setInputMessage("");

    // 데모: 다른 사용자 메시지 시뮬레이션 (랜덤)
    if (Math.random() > 0.7) {
      setTimeout(() => {
        const demoNicknames = ["익명1", "익명2", "익명3", "익명4", "익명5"];
        const demoMessages = [
          "좋은 방송이네요!",
          "응원합니다!",
          "재밌어요",
          "화이팅!",
          "👍",
        ];
        const demoId = `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const demoMessage: ChatMessage = {
          id: demoId,
          nickname: demoNicknames[Math.floor(Math.random() * demoNicknames.length)],
          message: demoMessages[Math.floor(Math.random() * demoMessages.length)],
          timestamp: new Date(),
          isMine: false,
        };
        setMessages((prev) => [...prev, demoMessage]);
      }, 1000 + Math.random() * 2000);
    }
  };

  // Enter 키로 전송
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 대화명 변경 가능 여부 확인
  const canChangeNickname = () => {
    const now = Date.now();
    return now - lastNicknameChange >= 30000;
  };

  const remainingCooldown = Math.max(0, 30000 - (Date.now() - lastNicknameChange));

  return (
    <div className="flex h-full flex-col rounded-xl border border-zinc-800/80 bg-zinc-950/90">
      {/* 채팅 헤더 */}
      <div className="flex items-center justify-between border-b border-zinc-800/70 px-4 py-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-zinc-50">라이브 채팅</h3>
          <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-semibold text-red-400 border border-red-500/50">
            데모 모드
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isEditingNickname ? (
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={nicknameInput}
                onChange={(e) => setNicknameInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleNicknameChange();
                  } else if (e.key === "Escape") {
                    setIsEditingNickname(false);
                    setNicknameInput(nickname);
                  }
                }}
                className="w-24 rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-50 outline-none focus:border-amber-500"
                autoFocus
                maxLength={20}
              />
              <button
                onClick={handleNicknameChange}
                disabled={!canChangeNickname()}
                className="rounded-md border border-emerald-500/70 bg-emerald-500/20 px-2 py-1 text-[10px] font-semibold text-emerald-200 hover:bg-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                확인
              </button>
              <button
                onClick={() => {
                  setIsEditingNickname(false);
                  setNicknameInput(nickname);
                }}
                className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-[10px] font-semibold text-zinc-400 hover:bg-zinc-800 transition"
              >
                취소
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditingNickname(true)}
              disabled={!canChangeNickname()}
              className="flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <User className="h-3.5 w-3.5" />
              <span>{nickname}</span>
              {!canChangeNickname() && (
                <span className="text-[10px] text-zinc-500">
                  ({Math.ceil(remainingCooldown / 1000)}초)
                </span>
              )}
              <Edit2 className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* 채팅 메시지 영역 */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-3 py-3 space-y-2"
        style={{ maxHeight: "400px" }}
      >
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-xs text-zinc-500 text-center">
              채팅을 시작해보세요!
              <br />
              <span className="text-[10px]">데모 모드: 메시지는 저장되지 않습니다.</span>
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMyMessage = myMessageIds.has(msg.id);
            return (
              <div
                key={msg.id}
                className={`flex flex-col gap-0.5 ${
                  isMyMessage ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`flex items-center gap-1.5 ${
                    isMyMessage ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  <span className="text-[10px] font-medium text-zinc-400">
                    {msg.nickname}
                  </span>
                  {isMyMessage && (
                    <span className="rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-semibold text-amber-300 border border-amber-500/50">
                      나
                    </span>
                  )}
                  <span className="text-[9px] text-zinc-600">
                    {msg.timestamp.toLocaleTimeString("ko-KR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 text-xs ${
                    isMyMessage
                      ? "bg-amber-500/20 border border-amber-500/50 text-amber-100"
                      : "bg-zinc-900/80 border border-zinc-800/70 text-zinc-200"
                  }`}
                >
                  {msg.message}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 채팅 입력 영역 */}
      <div className="border-t border-zinc-800/70 p-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="메시지를 입력하세요..."
            className="flex-1 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-50 placeholder-zinc-500 outline-none focus:border-amber-500"
            maxLength={200}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim()}
            className="inline-flex items-center justify-center rounded-md border border-amber-500/70 bg-amber-500/20 px-3 py-2 text-sm font-semibold text-amber-200 hover:bg-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-1.5 text-[10px] text-zinc-500 text-center">
          데모 모드: 채팅은 저장되지 않으며 페이지를 새로고침하면 사라집니다.
        </p>
      </div>
    </div>
  );
}
