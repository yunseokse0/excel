"use server";

import { getSupabaseServerClient } from "../supabase-server";

/**
 * Supabase Storage에 이미지를 업로드합니다.
 * @param file 파일 데이터 (FormData에서 추출)
 * @param fileName 파일명
 * @returns 업로드된 파일의 공개 URL
 */
export async function uploadAdImage(
  file: File,
  fileName?: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return { success: false, error: "Supabase Storage가 설정되지 않았습니다." };
    }

    // 파일명 생성 (없으면 타임스탬프 사용)
    const timestamp = Date.now();
    const sanitizedFileName =
      fileName ||
      `ad-${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;

    // Supabase Storage에 업로드
    const { data, error } = await supabase.storage
      .from("ads") // 버킷 이름: 'ads'
      .upload(sanitizedFileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("Failed to upload image:", error);
      return { success: false, error: error.message };
    }

    // 공개 URL 가져오기
    const {
      data: { publicUrl },
    } = supabase.storage.from("ads").getPublicUrl(data.path);

    return { success: true, url: publicUrl };
  } catch (error) {
    console.error("Error uploading image:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * 이미지 파일을 삭제합니다.
 */
export async function deleteAdImage(filePath: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return { success: false, error: "Supabase Storage가 설정되지 않았습니다." };
    }

    // URL에서 경로 추출
    const path = filePath.split("/ads/")[1];
    if (!path) {
      return { success: false, error: "Invalid file path" };
    }

    const { error } = await supabase.storage.from("ads").remove([path]);

    if (error) {
      console.error("Failed to delete image:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Error deleting image:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
