import { NextResponse } from "next/server";
import { prisma, ensureDbExists } from "@/lib/prisma";
import { z } from "zod";

// Validation schema for report generation
const generateReportSchema = z.object({
  name: z.string().min(1, "Report name is required"),
  type: z.enum(["ward", "status", "budget", "timeline", "custom"]),
  parameters: z.object({
    wardId: z.string().optional(),
    fiscalYearId: z.string().optional(),
    status: z.string().optional(),
    programTypeId: z.string().optional(),
    fundingSourceId: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    format: z.enum(["pdf", "excel", "csv"]).default("pdf"),
    includeCharts: z.boolean().default(true),
    includeDataTables: z.boolean().default(true),
    includeRawData: z.boolean().default(false),
    includeMetadata: z.boolean().default(true)
  }),
  generatedById: z.string().optional() // TODO: Get from session
});

// GET - Fetch reports
export async function GET(request: Request) {
  try {
    await ensureDbExists();

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build where clause
    const whereClause: Record<string, unknown> = {};
    
    if (type) {
      whereClause.type = type;
    }
    
    if (status) {
      whereClause.status = status;
    }

    // Fetch reports
    const reports = await prisma.report.findMany({
      where: whereClause,
      include: {
        generatedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: offset
    });

    // Transform for frontend
    const transformedReports = reports.map(report => ({
      id: report.id,
      name: report.name,
      type: formatReportType(report.type),
      status: report.status,
      filePath: report.filePath,
      fileSize: report.fileSize ? formatFileSize(report.fileSize) : null,
      parameters: report.parameters,
      generatedBy: report.generatedBy.name,
      createdAt: report.createdAt.toISOString(),
      completedAt: report.completedAt?.toISOString(),
      generated: report.createdAt.toISOString().split('T')[0],
      downloadUrl: report.filePath ? `/api/reports/${report.id}/download` : null
    }));

    return NextResponse.json({
      reports: transformedReports,
      total: transformedReports.length
    });

  } catch (error) {
    console.error("Error fetching reports:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Generate a new report
export async function POST(request: Request) {
  try {
    await ensureDbExists();

    const body = await request.json();
    const validatedData = generateReportSchema.parse(body);

    // Create report record
    const report = await prisma.report.create({
      data: {
        name: validatedData.name,
        type: validatedData.type,
        parameters: validatedData.parameters,
        status: "generating",
        generatedById: validatedData.generatedById || "system" // TODO: Get from session
      }
    });

    // Start report generation (in a real app, this would be async)
    try {
      const reportData = await generateReportData(validatedData.type, validatedData.parameters);
      
      // For now, we'll just simulate file generation
      const fileName = `${validatedData.name.replace(/\s+/g, '_')}_${Date.now()}.${validatedData.parameters.format}`;
      const filePath = `/reports/${fileName}`;
      const fileSize = JSON.stringify(reportData).length; // Simulated file size

      // Update report with completion
      await prisma.report.update({
        where: { id: report.id },
        data: {
          status: "completed",
          filePath: filePath,
          fileSize: fileSize,
          completedAt: new Date()
        }
      });

      return NextResponse.json({ 
        report: {
          ...report,
          status: "completed",
          filePath,
          fileSize,
          downloadUrl: `/api/reports/${report.id}/download`
        }
      }, { status: 201 });

    } catch (generationError) {
      // Update report with failure
      await prisma.report.update({
        where: { id: report.id },
        data: {
          status: "failed",
          completedAt: new Date()
        }
      });

      return NextResponse.json({
        error: "Report generation failed",
        reportId: report.id
      }, { status: 500 });
    }

  } catch (error) {
    console.error("Error creating report:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper function to generate report data based on type
async function generateReportData(type: string, parameters: Record<string, unknown>) {
  const baseFilters: Record<string, unknown> = {};
  
  if (parameters.wardId) {
    baseFilters.wardId = parameters.wardId;
  }
  
  if (parameters.fiscalYearId) {
    baseFilters.fiscalYearId = parameters.fiscalYearId;
  }
  
  if (parameters.status) {
    baseFilters.status = parameters.status;
  }

  switch (type) {
    case "ward":
      return await generateWardReport(baseFilters, parameters);
    case "status":
      return await generateStatusReport(baseFilters, parameters);
    case "budget":
      return await generateBudgetReport(baseFilters, parameters);
    case "timeline":
      return await generateTimelineReport(baseFilters, parameters);
    case "custom":
      return await generateCustomReport(baseFilters, parameters);
    default:
      throw new Error("Unknown report type");
  }
}

async function generateWardReport(filters: Record<string, unknown>, parameters: Record<string, unknown>) {
  const programs = await prisma.program.findMany({
    where: filters,
    include: {
      ward: true,
      fiscalYear: true,
      programType: true,
      fundingSource: true,
      payments: { where: { status: "approved" } }
    }
  });

  // Group by ward and calculate statistics
  const wardData = programs.reduce((acc: Record<string, unknown>, program) => {
    const wardKey = program.ward.code;
    if (!acc[wardKey]) {
      acc[wardKey] = {
        ward: program.ward,
        programs: [],
        totalBudget: 0,
        totalSpent: 0
      };
    }
    
    acc[wardKey].programs.push(program);
    acc[wardKey].totalBudget += Number(program.budget || 0);
    acc[wardKey].totalSpent += program.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
    
    return acc;
  }, {});

  return {
    type: "ward",
    data: Object.values(wardData),
    summary: {
      totalWards: Object.keys(wardData).length,
      totalPrograms: programs.length,
      totalBudget: programs.reduce((sum, p) => sum + Number(p.budget || 0), 0)
    }
  };
}

async function generateStatusReport(filters: Record<string, unknown>, _parameters: Record<string, unknown>) {
  const statusCounts = await prisma.program.groupBy({
    by: ['status'],
    where: filters,
    _count: { status: true },
    _sum: { budget: true }
  });

  return {
    type: "status",
    data: statusCounts,
    summary: {
      totalStatuses: statusCounts.length,
      totalPrograms: statusCounts.reduce((sum, s) => sum + s._count.status, 0)
    }
  };
}

async function generateBudgetReport(filters: Record<string, unknown>, _parameters: Record<string, unknown>) {
  const programs = await prisma.program.findMany({
    where: filters,
    include: {
      payments: { where: { status: "approved" } },
      fundingSource: true
    }
  });

  return {
    type: "budget",
    data: programs.map(p => ({
      program: p,
      allocated: Number(p.budget || 0),
      spent: p.payments.reduce((sum, payment) => sum + Number(payment.amount), 0)
    })),
    summary: {
      totalAllocated: programs.reduce((sum, p) => sum + Number(p.budget || 0), 0),
      totalSpent: programs.reduce((sum, p) => sum + p.payments.reduce((pSum, payment) => pSum + Number(payment.amount), 0), 0)
    }
  };
}

async function generateTimelineReport(filters: Record<string, unknown>, _parameters: Record<string, unknown>) {
  const programs = await prisma.program.findMany({
    where: {
      ...filters,
      startDate: { not: null },
      endDate: { not: null }
    },
    include: {
      ward: true,
      monitoring: true
    }
  });

  return {
    type: "timeline",
    data: programs,
    summary: {
      totalPrograms: programs.length,
      onSchedule: programs.filter(p => new Date(p.endDate!) > new Date()).length
    }
  };
}

async function generateCustomReport(filters: Record<string, unknown>, parameters: Record<string, unknown>) {
  // Custom report logic based on parameters
  const programs = await prisma.program.findMany({
    where: filters,
    include: {
      ward: true,
      fiscalYear: true,
      programType: true,
      fundingSource: true,
      documents: true,
      approvals: true,
      payments: true,
      monitoring: true
    }
  });

  return {
    type: "custom",
    data: programs,
    parameters: parameters
  };
}

// Helper functions
function formatReportType(type: string): string {
  switch (type) {
    case "ward": return "Ward Report";
    case "status": return "Status Report";
    case "budget": return "Budget Report";
    case "timeline": return "Timeline Report";
    case "custom": return "Custom Report";
    default: return type;
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
