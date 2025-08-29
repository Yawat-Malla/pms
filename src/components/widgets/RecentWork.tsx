"use client";
import { useState, useEffect } from "react";
import { Card } from "../ui/Card";
import { IconButton } from "../ui/IconButton";
import { ChevronRight, Loader2 } from "lucide-react";
import { Tag } from "../ui/Tag";

interface Program {
  id: string;
  name: string;
  code: string;
  status: string;
}

export function RecentWork() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentPrograms = async () => {
      try {
        const response = await fetch('/api/dashboard/recent-programs?limit=3');
        if (response.ok) {
          const data = await response.json();
          setPrograms(data.programs || []);
        }
      } catch (error) {
        console.error('Error fetching recent programs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentPrograms();
  }, []);

  const getProgressColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'green';
      case 'ACTIVE': return 'blue';
      case 'APPROVED': return 'violet';
      case 'SUBMITTED': return 'amber';
      default: return 'gray';
    }
  };

  const getStatusProgress = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 100;
      case 'ACTIVE': return 75;
      case 'APPROVED': return 50;
      case 'SUBMITTED': return 25;
      default: return 10;
    }
  };

  return (
    <Card>
      <div className="flex items-center justify-between py-3 px-3">
        <div className="font-medium text-gray-700">Recent Programs</div>
        <IconButton><ChevronRight className="h-4 w-4" /></IconButton>
      </div>
      <div className="space-y-3 px-3 pb-3">
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          </div>
        ) : programs.length > 0 ? programs.map((program) => (
          <div key={program.id} className="flex items-center justify-between rounded-xl border p-3">
            <div>
              <div className="text-sm font-medium">{program.name}</div>
              <div className="mt-1 text-xs text-gray-500">
                {program.code} · Status: {program.status}
              </div>
            </div>
            <Tag tone={getProgressColor(program.status)}>
              {getStatusProgress(program.status)}%
            </Tag>
          </div>
        )) : (
          <div className="text-center py-4 text-sm text-gray-500">
            No recent programs
          </div>
        )}
      </div>
    </Card>
  );
}