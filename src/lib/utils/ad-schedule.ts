/**
 * 광고 스케줄링 유틸리티 함수
 */

/**
 * 현재 시간이 광고 스케줄 범위 내에 있는지 확인합니다.
 */
export function isWithinSchedule(
  scheduleDays?: number[] | null,
  scheduleStartTime?: string | null,
  scheduleEndTime?: string | null,
  timezone: string = "Asia/Seoul"
): boolean {
  // 스케줄이 설정되지 않았으면 항상 true
  if (!scheduleDays || scheduleDays.length === 0) {
    return true;
  }

  // 현재 시간 가져오기 (타임존 고려)
  const now = new Date();
  const koreaTime = new Date(
    now.toLocaleString("en-US", { timeZone: timezone })
  );

  // 현재 요일 확인 (0=일요일, 1=월요일, ..., 6=토요일)
  const currentDay = koreaTime.getDay();

  // 요일 체크
  if (!scheduleDays.includes(currentDay)) {
    return false;
  }

  // 시간 체크
  if (scheduleStartTime && scheduleEndTime) {
    const [startHour, startMinute] = scheduleStartTime.split(":").map(Number);
    const [endHour, endMinute] = scheduleEndTime.split(":").map(Number);

    const currentHour = koreaTime.getHours();
    const currentMinute = koreaTime.getMinutes();

    const currentTimeMinutes = currentHour * 60 + currentMinute;
    const startTimeMinutes = startHour * 60 + startMinute;
    const endTimeMinutes = endHour * 60 + endMinute;

    // 자정을 넘어가는 경우 처리
    if (startTimeMinutes > endTimeMinutes) {
      // 예: 22:00 ~ 02:00
      return (
        currentTimeMinutes >= startTimeMinutes ||
        currentTimeMinutes <= endTimeMinutes
      );
    } else {
      // 일반적인 경우
      return (
        currentTimeMinutes >= startTimeMinutes &&
        currentTimeMinutes <= endTimeMinutes
      );
    }
  }

  return true;
}

/**
 * 요일 번호를 한글 요일로 변환합니다.
 */
export function getDayName(day: number): string {
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  return days[day] || "";
}
