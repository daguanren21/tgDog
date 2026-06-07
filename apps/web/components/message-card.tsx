import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/input";

interface MediaItem {
  id: string;
  type: string;
  r2Url: string;
  fileName: string | null;
  mimeType: string | null;
}

interface MessageCardProps {
  senderName: string | null;
  sourceTitle: string;
  text: string;
  timestamp: Date;
  isForwarded: boolean;
  media: MediaItem[];
}

function fmtTime(d: Date): string {
  return new Date(d).toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function MessageCard({
  senderName,
  sourceTitle,
  text,
  timestamp,
  isForwarded,
  media,
}: MessageCardProps) {
  const images = media.filter(
    (m) => m.type === "PHOTO" || m.mimeType?.startsWith("image/"),
  );
  const files = media.filter((m) => !images.includes(m));

  return (
    <Card className="p-4">
      <div className="mb-1.5 flex items-center gap-2 text-xs text-muted-foreground">
        <Badge>{sourceTitle}</Badge>
        {senderName && <span className="font-medium text-foreground">{senderName}</span>}
        {isForwarded && <span className="text-primary">转发</span>}
        <span className="ml-auto tabular-nums">{fmtTime(timestamp)}</span>
      </div>

      {text && (
        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
          {text}
        </p>
      )}

      {images.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {images.map((m) => (
            // 使用原生 img：R2 公开域名运行时才确定，避免 next/image 域名约束
            // eslint-disable-next-line @next/next/no-img-element
            <a key={m.id} href={m.r2Url} target="_blank" rel="noreferrer">
              <img
                src={m.r2Url}
                alt={m.fileName ?? "media"}
                loading="lazy"
                className="h-28 w-28 rounded-md border border-border object-cover"
              />
            </a>
          ))}
        </div>
      )}

      {files.length > 0 && (
        <div className="mt-2 flex flex-col gap-1">
          {files.map((m) => (
            <a
              key={m.id}
              href={m.r2Url}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-primary hover:underline"
            >
              📎 {m.fileName ?? m.type}
            </a>
          ))}
        </div>
      )}
    </Card>
  );
}
