import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma, ensureDbExists } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    await ensureDbExists();

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { status, ward, fiscalYear } = await request.json();

    // Build where clause
    const whereClause: Record<string, unknown> = {};
    
    if (status) {
      whereClause.status = status;
    }

    const programFilters: Record<string, unknown> = {};
    if (ward) {
      programFilters.wardId = ward;
    }
    if (fiscalYear) {
      programFilters.fiscalYearId = fiscalYear;
    }

    if (Object.keys(programFilters).length > 0) {
      whereClause.program = programFilters;
    }

    // Fetch approvals
    const approvals = await prisma.programApproval.findMany({
      where: whereClause,
      include: {
        program: {
          include: {
            ward: true,
            fiscalYear: true,
            programType: true,
            fundingSource: true,
          }
        },
        approvedBy: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Generate CSV content
    const csvHeaders = [
      'Program Code',
      'Program Name',
      'Ward',
      'Fiscal Year',
      'Program Type',
      'Budget',
      'Status',
      'Step',
      'Submitted Date',
      'Approved By',
      'Approved Date',
      'Remarks'
    ];

    const csvRows = approvals.map(approval => [
      approval.program.code,
      approval.program.name,
      approval.program.ward.name,
      approval.program.fiscalYear.year,
      approval.program.programType?.name || '',
      approval.program.budget ? approval.program.budget.toString() : '',
      approval.status,
      approval.step,
      approval.createdAt.toISOString().split('T')[0],
      approval.approvedBy?.name || '',
      approval.approvedAt ? approval.approvedAt.toISOString().split('T')[0] : '',
      approval.remarks || ''
    ]);

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="approvals-${status || 'all'}-${new Date().toISOString().split('T')[0]}.csv"`
      }
    });

  } catch (error) {
    console.error("Error exporting approvals:", error);
    return NextResponse.json(
      { error: "Failed to export approvals" },
      { status: 500 }
    );
  }
}
