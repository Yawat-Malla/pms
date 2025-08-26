"use client";
import { useMemo } from "react";

export function Avatar({ name }: { name: string }) {
  const initials = useMemo(() => name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase(), [name]);
  return (
    <div className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white text-xs font-semibold">
      {initials}
    </div>
  );
}