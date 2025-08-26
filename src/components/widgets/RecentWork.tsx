"use client";
import { Card } from "../ui/Card";
import { IconButton } from "../ui/IconButton";
import { ChevronRight } from "lucide-react";
import { Tag } from "../ui/Tag";

export function RecentWork() {
  return (
    <Card>
      <div className="flex items-center justify-between py-3 px-3">
        <div className="font-medium text-gray-700">Your recent project work</div>
        <IconButton><ChevronRight className="h-4 w-4" /></IconButton>
      </div>
      <div className="space-y-3 px-3 pb-3">
        <div className="flex items-center justify-between rounded-xl border p-3">
          <div>
            <div className="text-sm font-medium">Design of the page “Reviews”</div>
            <div className="mt-1 text-xs text-gray-500">Assigned: AP, JW · Progress 71%</div>
          </div>
          <Tag tone="blue">71%</Tag>
        </div>
        <div className="flex items-center justify-between rounded-xl border p-3">
          <div>
            <div className="text-sm font-medium">Preparing for UX testing</div>
            <div className="mt-1 text-xs text-gray-500">Assigned: RM · Progress 43%</div>
          </div>
          <Tag tone="violet">43%</Tag>
        </div>
      </div>
    </Card>
  );
}