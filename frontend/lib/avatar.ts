export interface AvatarMeta {
  initials: string;
  hasName: boolean;
}

export function getAvatarMeta(
  name: string | null | undefined,
  _phone?: string | null | undefined,
): AvatarMeta {
  const cleanName = (name ?? "").trim();
  if (cleanName) {
    const parts = cleanName.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return {
        initials: (parts[0][0] + parts[1][0]).toUpperCase(),
        hasName: true,
      };
    }
    return {
      initials: parts[0].slice(0, 2).toUpperCase(),
      hasName: true,
    };
  }
  return { initials: "?", hasName: false };
}
