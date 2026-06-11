interface AvatarProps {
  /** R2 对象 key（经 /api/avatar 代理读取）；无则显示首字母占位 */
  avatarKey?: string | null;
  /** 用于生成占位首字母的名称 */
  name: string;
  size?: number;
}

/** 圆形头像：有 avatarKey 走代理路由，否则用首字母占位 */
export function Avatar({ avatarKey, name, size = 32 }: AvatarProps) {
  const letter = name.trim().charAt(0).toUpperCase() || "?";
  const dim = `${size}px`;

  if (avatarKey) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`/api/avatar/${avatarKey}`}
        alt={name}
        width={size}
        height={size}
        className="shrink-0 rounded-full bg-muted object-cover"
        style={{ width: dim, height: dim }}
      />
    );
  }

  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground"
      style={{ width: dim, height: dim }}
      aria-hidden
    >
      {letter}
    </span>
  );
}
