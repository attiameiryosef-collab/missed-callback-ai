import { getAvatarMeta } from "@/lib/avatar";

interface AvatarProps {
  name?: string | null;
  phone?: string | null;
  size?: "sm" | "md" | "lg";
}

const sizes: Record<NonNullable<AvatarProps["size"]>, string> = {
  sm: "h-8 w-8 text-[11px]",
  md: "h-9 w-9 text-xs",
  lg: "h-12 w-12 text-sm",
};

export function Avatar({ name, phone, size = "md" }: AvatarProps) {
  const { initials, hasName } = getAvatarMeta(name, phone);
  const base =
    "rounded-full text-white font-semibold grid place-items-center shrink-0 ring-1 ring-white/10 shadow-sm";
  const gradient = hasName
    ? "bg-gradient-to-br from-indigo-500 to-purple-500"
    : "bg-gradient-to-br from-slate-400 to-slate-500";
  return (
    <div className={`${base} ${sizes[size]} ${gradient}`} aria-hidden>
      {initials}
    </div>
  );
}
