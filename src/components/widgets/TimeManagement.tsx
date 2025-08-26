"use client";
import { Card } from "../ui/Card";
import { Tag } from "../ui/Tag";

export function TimeManagement() {
  return (
    <Card>
      <div className="flex items-center justify-between py-3 px-3">
        <div className="font-medium text-gray-700">Time Management</div>
        <Tag tone="slate">Now</Tag>
      </div>
      <div className="px-3 pb-4 pt-2 text-sm text-gray-500">
        <div className="h-28 w-full rounded-xl bg-gradient-to-br from-indigo-50 to-fuchsia-50" />
        <div className="mt-2 grid grid-cols-7 text-center text-xs text-gray-500">
          {"Mon Tue Wed Thu Fri Sat Sun".split(" ").map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>
      </div>
    </Card>
  );
}