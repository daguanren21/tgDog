import { Api } from "telegram";
import type { TelegramClient } from "telegram";
import type { MediaType } from "@tgdog/db";

export interface ExtractedMedia {
  type: MediaType;
  fileName: string;
  mimeType?: string;
  fileSize?: number;
  width?: number;
  height?: number;
}

/** 判断消息是否带媒体，并提取媒体元信息（不下载） */
export function extractMediaMeta(msg: Api.Message): ExtractedMedia | null {
  const media = msg.media;
  if (!media) return null;

  // 图片
  if (media instanceof Api.MessageMediaPhoto || msg.photo) {
    return { type: "PHOTO", fileName: `photo_${msg.id}.jpg`, mimeType: "image/jpeg" };
  }

  // 文档（含视频/音频/语音/文件）
  if (media instanceof Api.MessageMediaDocument && media.document instanceof Api.Document) {
    const doc = media.document;
    const mimeType = doc.mimeType;
    let fileName = `file_${msg.id}`;
    let type: MediaType = "DOCUMENT";
    let width: number | undefined;
    let height: number | undefined;

    for (const attr of doc.attributes) {
      if (attr instanceof Api.DocumentAttributeFilename) {
        fileName = attr.fileName;
      } else if (attr instanceof Api.DocumentAttributeVideo) {
        type = "VIDEO";
        width = attr.w;
        height = attr.h;
      } else if (attr instanceof Api.DocumentAttributeAudio) {
        type = attr.voice ? "VOICE" : "AUDIO";
      }
    }
    if (mimeType?.startsWith("video/")) type = "VIDEO";
    else if (mimeType?.startsWith("audio/") && type === "DOCUMENT") type = "AUDIO";
    else if (mimeType?.startsWith("image/") && type === "DOCUMENT") type = "PHOTO";

    return {
      type,
      fileName,
      mimeType,
      fileSize: typeof doc.size === "number" ? doc.size : Number(doc.size ?? 0),
      width,
      height,
    };
  }

  return { type: "OTHER", fileName: `media_${msg.id}` };
}

/** 下载媒体为 Buffer（失败返回 null） */
export async function downloadMediaBuffer(
  client: TelegramClient,
  msg: Api.Message,
): Promise<Buffer | null> {
  try {
    const result = await client.downloadMedia(msg, {});
    if (result instanceof Buffer) return result;
    return null;
  } catch (err) {
    console.error(`[media] 下载失败 msg=${msg.id}:`, (err as Error).message);
    return null;
  }
}
