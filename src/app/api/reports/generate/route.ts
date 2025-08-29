import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma, ensureDbExists } from "@/lib/prisma";
import { z } from "zod";

const generateReportSchema = z.object({
  type: z.enum(["ward", "status", "timeline", "budget", "custom"]),
  title: z.string(),
  filters: z.object({
    wardId: z.string().optional(),
    fiscalYearId: z.string().optional(),
    status: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }).optional(),
});

export async function POST(request: NextRequest) {
  try {
    await ensureDbExists();

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { type, title, filters } = generateReportSchema.parse(body);

    // Generate report data based on type
    let reportData;
    let htmlContent;

    switch (type) {
      case "ward":
        reportData = await generateWardReport(filters);
        htmlContent = generateWardReportHTML(reportData, title);
        break;
      case "status":
        reportData = await generateStatusReport(filters);
        htmlContent = generateStatusReportHTML(reportData, title);
        break;
      case "timeline":
        reportData = await generateTimelineReport(filters);
        htmlContent = generateTimelineReportHTML(reportData, title);
        break;
      case "budget":
        reportData = await generateBudgetReport(filters);
        htmlContent = generateBudgetReportHTML(reportData, title);
        break;
      case "custom":
        reportData = await generateCustomReport(filters);
        htmlContent = generateCustomReportHTML(reportData, title);
        break;
      default:
        return NextResponse.json({ error: "Invalid report type" }, { status: 400 });
    }

    // Save report to database
    const report = await prisma.report.create({
      data: {
        title,
        type,
        status: "completed",
        generatedById: session.user.id,
        filters: filters || {},
        fileUrl: `/api/reports/${type}/download`, // We'll implement download endpoint
        fileSize: htmlContent.length,
        format: "pdf",
      }
    });

    // Return HTML content for PDF generation on client side
    return NextResponse.json({
      success: true,
      report: {
        id: report.id,
        title: report.title,
        type: report.type,
        htmlContent,
        createdAt: report.createdAt,
      }
    });

  } catch (error) {
    console.error("Error generating report:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}

async function generateWardReport(filters: Record<string, unknown>) {
  const whereClause: Record<string, unknown> = {};
  
  if (filters?.wardId) {
    whereClause.wardId = filters.wardId;
  }
  
  if (filters?.fiscalYearId) {
    whereClause.fiscalYearId = filters.fiscalYearId;
  }

  const programs = await prisma.program.findMany({
    where: whereClause,
    include: {
      ward: true,
      fiscalYear: true,
      programType: true,
      fundingSource: true,
    },
    orderBy: {
      ward: { name: 'asc' }
    }
  });

  // Group by ward
  const wardData = programs.reduce((acc: Record<string, unknown>, program) => {
    const wardName = program.ward.name;
    if (!acc[wardName]) {
      acc[wardName] = {
        ward: program.ward,
        programs: [],
        totalBudget: 0,
        programCount: 0,
      };
    }
    acc[wardName].programs.push(program);
    acc[wardName].totalBudget += Number(program.budget || 0);
    acc[wardName].programCount += 1;
    return acc;
  }, {});

  return Object.values(wardData);
}

async function generateStatusReport(filters: Record<string, unknown>) {
  const whereClause: Record<string, unknown> = {};
  
  if (filters?.wardId) {
    whereClause.wardId = filters.wardId;
  }
  
  if (filters?.fiscalYearId) {
    whereClause.fiscalYearId = filters.fiscalYearId;
  }

  const programs = await prisma.program.findMany({
    where: whereClause,
    include: {
      ward: true,
      fiscalYear: true,
    }
  });

  // Group by status
  const statusData = programs.reduce((acc: Record<string, unknown>, program) => {
    const status = program.status;
    if (!acc[status]) {
      acc[status] = {
        status,
        programs: [],
        count: 0,
        totalBudget: 0,
      };
    }
    acc[status].programs.push(program);
    acc[status].count += 1;
    acc[status].totalBudget += Number(program.budget || 0);
    return acc;
  }, {});

  return Object.values(statusData);
}

async function generateTimelineReport(_filters: Record<string, unknown>) {
  // Implementation for timeline report
  return [];
}

async function generateBudgetReport(filters: Record<string, unknown>) {
  const whereClause: Record<string, unknown> = {};
  
  if (filters?.wardId) {
    whereClause.wardId = filters.wardId;
  }
  
  if (filters?.fiscalYearId) {
    whereClause.fiscalYearId = filters.fiscalYearId;
  }

  const programs = await prisma.program.findMany({
    where: whereClause,
    include: {
      ward: true,
      fiscalYear: true,
      payments: true,
    }
  });

  return programs.map(program => ({
    ...program,
    totalSpent: program.payments.reduce((sum: number, payment: { status: string; amount: string | number }) =>
      sum + (payment.status === 'approved' ? Number(payment.amount) : 0), 0
    ),
    remainingBudget: Number(program.budget || 0) - program.payments.reduce((sum: number, payment: { status: string; amount: string | number }) =>
      sum + (payment.status === 'approved' ? Number(payment.amount) : 0), 0
    ),
  }));
}

async function generateCustomReport(_filters: Record<string, unknown>) {
  // Implementation for custom report
  return [];
}

function generateWardReportHTML(data: Record<string, unknown>[], title: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .ward-section { margin-bottom: 30px; page-break-inside: avoid; }
        .ward-title { background: #f5f5f5; padding: 10px; font-weight: bold; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .summary { background: #e8f4fd; padding: 10px; margin-top: 10px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${title}</h1>
        <p>Generated on: ${new Date().toLocaleDateString()}</p>
      </div>
      
      ${data.map((wardData: Record<string, unknown>) => `
        <div class="ward-section">
          <div class="ward-title">${wardData.ward.name} (${wardData.ward.code})</div>
          <div class="summary">
            <strong>Total Programs:</strong> ${wardData.programCount} | 
            <strong>Total Budget:</strong> Rs. ${wardData.totalBudget.toLocaleString()}
          </div>
          <table>
            <thead>
              <tr>
                <th>Program Code</th>
                <th>Program Name</th>
                <th>Type</th>
                <th>Budget</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${(wardData.programs as Record<string, unknown>[]).map((program: Record<string, unknown>) => `
                <tr>
                  <td>${program.code}</td>
                  <td>${program.name}</td>
                  <td>${program.programType?.name || '-'}</td>
                  <td>Rs. ${Number(program.budget || 0).toLocaleString()}</td>
                  <td>${program.status}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `).join('')}
    </body>
    </html>
  `;
}

function generateStatusReportHTML(data: Record<string, unknown>[], title: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .status-section { margin-bottom: 30px; page-break-inside: avoid; }
        .status-title { background: #f5f5f5; padding: 10px; font-weight: bold; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .summary { background: #e8f4fd; padding: 10px; margin-top: 10px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${title}</h1>
        <p>Generated on: ${new Date().toLocaleDateString()}</p>
      </div>
      
      ${data.map((statusData: Record<string, unknown>) => `
        <div class="status-section">
          <div class="status-title">Status: ${statusData.status}</div>
          <div class="summary">
            <strong>Total Programs:</strong> ${statusData.count} | 
            <strong>Total Budget:</strong> Rs. ${statusData.totalBudget.toLocaleString()}
          </div>
          <table>
            <thead>
              <tr>
                <th>Program Code</th>
                <th>Program Name</th>
                <th>Ward</th>
                <th>Budget</th>
                <th>Fiscal Year</th>
              </tr>
            </thead>
            <tbody>
              ${(statusData.programs as Record<string, unknown>[]).map((program: Record<string, unknown>) => `
                <tr>
                  <td>${program.code}</td>
                  <td>${program.name}</td>
                  <td>${program.ward.name}</td>
                  <td>Rs. ${Number(program.budget || 0).toLocaleString()}</td>
                  <td>${program.fiscalYear.year}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `).join('')}
    </body>
    </html>
  `;
}

function generateTimelineReportHTML(_data: Record<string, unknown>[], title: string) {
  return `<html><body><h1>${title}</h1><p>Timeline report implementation coming soon...</p></body></html>`;
}

function generateBudgetReportHTML(data: Record<string, unknown>[], title: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .total-row { background-color: #f9f9f9; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${title}</h1>
        <p>Generated on: ${new Date().toLocaleDateString()}</p>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>Program Code</th>
            <th>Program Name</th>
            <th>Ward</th>
            <th>Allocated Budget</th>
            <th>Total Spent</th>
            <th>Remaining</th>
            <th>Utilization %</th>
          </tr>
        </thead>
        <tbody>
          ${data.map((program: Record<string, unknown>) => `
            <tr>
              <td>${program.code}</td>
              <td>${program.name}</td>
              <td>${program.ward.name}</td>
              <td>Rs. ${Number(program.budget || 0).toLocaleString()}</td>
              <td>Rs. ${program.totalSpent.toLocaleString()}</td>
              <td>Rs. ${program.remainingBudget.toLocaleString()}</td>
              <td>${program.budget ? Math.round((program.totalSpent / Number(program.budget)) * 100) : 0}%</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </body>
    </html>
  `;
}

function generateCustomReportHTML(_data: Record<string, unknown>[], title: string) {
  return `<html><body><h1>${title}</h1><p>Custom report implementation coming soon...</p></body></html>`;
}
