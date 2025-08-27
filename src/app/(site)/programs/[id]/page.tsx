"use client";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import Shell from "@/components/layout/Shell";
import { Card } from "@/components/ui/Card";
import { RecentWork } from "@/components/widgets/RecentWork";
import { TimeManagement } from "@/components/widgets/TimeManagement";
import { UpcomingDeadlines } from "@/components/widgets/UpcomingDeadlines";
import { motion } from "framer-motion";
import { Edit, Trash2, Download, Calendar, Building2, DollarSign, User, FileText, Upload, MessageSquare, Eye } from "lucide-react";
import { HydrationSafe } from "@/components/ui/HydrationSafe";

interface Program {
  id: string;
  code: string;
  name: string;
  ward: {
    id: string;
    code: string;
    name: string;
  };
  fiscalYear: {
    id: string;
    year: string;
    isActive: boolean;
  };
  fiscalYearId: string;
  programType: {
    id: string;
    name: string;
    code: string;
  };
  programTypeId: string;
  fundingSource: {
    id: string;
    name: string;
    code: string;
  };
  fundingSourceId: string;
  budget: number | null;
  status: string;
  startDate: string;
  endDate: string;
  description: string;
  responsibleOfficer: string;
  tags: string[];
  createdBy?: {
    id: string;
    name: string;
  } | null;
}

export default function ProgramDetailsPage() {
  const params = useParams();
  const programId = params.id;
  const [program, setProgram] = useState<Program | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch program data from API
  useEffect(() => {
    const fetchProgram = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/programs/${programId}`);
        if (response.ok) {
          const data = await response.json();
          setProgram(data.program);
        } else {
          setError('Failed to fetch program details');
        }
      } catch (error) {
        console.error('Error fetching program details:', error);
        setError('Network error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (programId) {
      fetchProgram();
    }
  }, [programId]);
  
  // Demo data for expenditure - in real app, fetch from API
  const expenditure = 1800000;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'SUBMITTED': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'APPROVED': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'VERIFIED': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'RECOMMENDED': return 'bg-pink-100 text-pink-700 border-pink-200';
      case 'CONTRACTED': return 'bg-cyan-100 text-cyan-700 border-cyan-200';
      case 'MONITORING': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'PAYMENT_RUNNING': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'PAYMENT_FINAL': return 'bg-green-100 text-green-700 border-green-200';
      case 'CLOSED': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'ARCHIVED': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const progressPercentage = program?.budget ? Math.round((expenditure / program.budget) * 100) : 0;

  if (loading) {
    return (
      <Shell>
        <Card>
          <div className="p-8 text-center">
            <div className="animate-pulse flex flex-col items-center">
              <div className="h-8 w-64 bg-gray-200 rounded mb-4"></div>
              <div className="h-4 w-48 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 w-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </Card>
      </Shell>
    );
  }

  if (error || !program) {
    return (
      <Shell>
        <Card>
          <div className="p-8 text-center">
            <div className="text-xl font-semibold text-red-500 mb-2">Error</div>
            <div className="text-gray-600">{error || 'Program not found'}</div>
          </div>
        </Card>
      </Shell>
    );
  }

  return (
    <Shell rightRail={<><RecentWork /><TimeManagement /><UpcomingDeadlines /></>}>
      {/* Header Section */}
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4 p-4">
          <div className="flex-1">
            <div className="mb-2">
              <span className={`inline-flex items-center rounded-lg border px-2 py-1 text-xs ${getStatusColor(program.status)}`}>
                {formatStatus(program.status)}
              </span>
            </div>
            <div className="text-2xl font-bold mb-2">{program.name}</div>
            <div className="text-sm text-gray-600 mb-3">
              Ward {program.ward.code} - {program.ward.name} • FY {program.fiscalYear?.year} • {program.code}
            </div>
            <div className="text-sm text-gray-700">{program.description}</div>
          </div>
          <div className="flex items-center gap-2">
            <motion.button 
              whileHover={{ y: -1 }} 
              whileTap={{ scale: 0.98 }} 
              className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
            >
              <Edit className="mr-2 inline h-4 w-4" /> Edit
            </motion.button>
            <motion.button 
              whileHover={{ y: -1 }} 
              whileTap={{ scale: 0.98 }} 
              className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
            >
              <Download className="mr-2 inline h-4 w-4" /> PDF Report
            </motion.button>
            <motion.button 
              whileHover={{ y: -1 }} 
              whileTap={{ scale: 0.98 }} 
              className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50 text-rose-600"
            >
              <Trash2 className="mr-2 inline h-4 w-4" /> Delete
            </motion.button>
          </div>
        </div>
      </Card>

      {/* Summary Panel */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <div className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-blue-100">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-xs text-gray-500">Budget vs Expenditure</div>
                <div className="font-medium">Rs. {program.budget?.toLocaleString()}</div>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${progressPercentage}%` }}></div>
            </div>
            <div className="text-xs text-gray-500">
              {progressPercentage}% spent • Rs. {expenditure.toLocaleString()} used
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-100">
                <Calendar className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <div className="text-xs text-gray-500">Timeline</div>
                <div className="font-medium">
                  <HydrationSafe>
                    {program.startDate ? new Date(program.startDate).toLocaleDateString() : 'Not set'}
                  </HydrationSafe>
                </div>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              to <HydrationSafe>{program.endDate ? new Date(program.endDate).toLocaleDateString() : 'Not set'}</HydrationSafe>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-purple-100">
                <Building2 className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="text-xs text-gray-500">Program Type</div>
                <div className="font-medium text-sm">{program.programType?.name}</div>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              Funding: {program.fundingSource?.name}
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-orange-100">
                <User className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <div className="text-xs text-gray-500">Responsible Officer</div>
                <div className="font-medium text-sm">{program.responsibleOfficer || 'Not assigned'}</div>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              Created by: {program.createdBy?.name || 'System'}
            </div>
          </div>
        </Card>
      </div>

      {/* Tabbed Sections */}
      <Card>
        <div className="border-b">
          <div className="flex items-center gap-6 px-4">
            {["Estimation", "Monitoring", "Payments", "Approvals", "Audit Log"].map((tab) => (
              <button key={tab} className="border-b-2 border-transparent px-3 py-4 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300">
                {tab}
              </button>
            ))}
          </div>
        </div>
        
        {/* Tab Content - Estimation */}
        <div className="p-4">
          <div className="mb-4">
            <div className="text-sm font-medium mb-2">Uploaded Documents</div>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-gray-500" />
                  <div>
                    <div className="text-sm font-medium">Detailed Cost Estimation.pdf</div>
                    <div className="text-xs text-gray-500">2.3 MB • Uploaded 2 days ago</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-1 hover:bg-gray-100 rounded">
                    <Eye className="h-4 w-4 text-gray-600" />
                  </button>
                  <button className="p-1 hover:bg-gray-100 rounded">
                    <Download className="h-4 w-4 text-gray-600" />
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-gray-500" />
                  <div>
                    <div className="text-sm font-medium">Technical Specifications.pdf</div>
                    <div className="text-xs text-gray-500">1.8 MB • Uploaded 1 week ago</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-1 hover:bg-gray-100 rounded">
                    <Eye className="h-4 w-4 text-gray-600" />
                  </button>
                  <button className="p-1 hover:bg-gray-100 rounded">
                    <Download className="h-4 w-4 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mb-4">
            <div className="text-sm font-medium mb-2">Cost Breakdown</div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="p-3 border rounded-lg">
                <div className="text-xs text-gray-500 mb-1">Materials</div>
                <div className="font-medium">Rs. 1,200,000</div>
                <div className="text-xs text-gray-500">48% of total</div>
              </div>
              <div className="p-3 border rounded-lg">
                <div className="text-xs text-gray-500 mb-1">Labor</div>
                <div className="font-medium">Rs. 800,000</div>
                <div className="text-xs text-gray-500">32% of total</div>
              </div>
              <div className="p-3 border rounded-lg">
                <div className="text-xs text-gray-500 mb-1">Equipment & Misc</div>
                <div className="font-medium">Rs. 500,000</div>
                <div className="text-xs text-gray-500">20% of total</div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Attachments Section */}
      <Card>
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-medium">Attachments</div>
            <motion.button 
              whileHover={{ y: -1 }} 
              whileTap={{ scale: 0.98 }} 
              className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
            >
              <Upload className="mr-2 inline h-4 w-4" /> Upload Files
            </motion.button>
          </div>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <div className="text-sm text-gray-600 mb-2">Drag and drop files here</div>
            <div className="text-xs text-gray-500">or click to browse</div>
          </div>
        </div>
      </Card>

      {/* Comments & Notes */}
      <Card>
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-medium">Comments & Notes</div>
            <motion.button 
              whileHover={{ y: -1 }} 
              whileTap={{ scale: 0.98 }} 
              className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
            >
              <MessageSquare className="mr-2 inline h-4 w-4" /> Add Comment
            </motion.button>
          </div>
          <div className="space-y-3">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">JD</div>
                <div className="text-sm font-medium">John Doe</div>
                <div className="text-xs text-gray-500">
                  <HydrationSafe>
                    {new Date().toLocaleDateString()}
                  </HydrationSafe>
                </div>
              </div>
              <div className="text-sm text-gray-700">Site inspection completed. All materials are on-site and work is progressing as planned.</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs">SM</div>
                <div className="text-sm font-medium">Sarah Manager</div>
                <div className="text-xs text-gray-500">
                  <HydrationSafe>
                    {new Date(Date.now() - 86400000).toLocaleDateString()}
                  </HydrationSafe>
                </div>
              </div>
              <div className="text-sm text-gray-700">Budget approval confirmed. Proceed with Phase 2 implementation.</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Related Programs */}
      <Card>
        <div className="p-4">
          <div className="text-sm font-medium mb-4">Related Programs in Ward {program.ward.code}</div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="p-3 border rounded-lg">
              <div className="text-sm font-medium mb-1">Water Supply Upgrade</div>
              <div className="text-xs text-gray-500">Status: Approved • Budget: Rs. 1.8M</div>
            </div>
            <div className="p-3 border rounded-lg">
              <div className="text-sm font-medium mb-1">Street Lighting Installation</div>
              <div className="text-xs text-gray-500">Status: Monitoring • Budget: Rs. 900K</div>
            </div>
          </div>
        </div>
      </Card>
    </Shell>
  );
}
