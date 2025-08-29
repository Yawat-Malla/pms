import { NextRequest, NextResponse } from "next/server";
import { prisma, ensureDbExists } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET dashboard analytics
export async function GET(request: NextRequest) {
  try {
    await ensureDbExists();

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const wardId = searchParams.get('wardId') || session.user.wardId;
    const fiscalYearId = searchParams.get('fiscalYearId');

    // Build base where clause for filtering by ward
    const baseWhere: Record<string, unknown> = {};
    if (wardId) {
      baseWhere.wardId = wardId;
    }
    if (fiscalYearId) {
      baseWhere.fiscalYearId = fiscalYearId;
    }

    // Get program statistics
    const [
      totalPrograms,
      programsByStatus,
      totalBudget,
      totalSpent,
      recentPrograms,
      pendingApprovals,
      pendingPayments,
      monitoringStats,
      wardStats
    ] = await Promise.all([
      // Total programs count
      prisma.program.count({ where: baseWhere }),

      // Programs by status
      prisma.program.groupBy({
        by: ['status'],
        where: baseWhere,
        _count: {
          status: true
        }
      }),

      // Total budget
      prisma.program.aggregate({
        where: baseWhere,
        _sum: {
          budget: true
        }
      }),

      // Total spent (from payments)
      prisma.programPayment.aggregate({
        where: {
          program: baseWhere,
          status: 'approved'
        },
        _sum: {
          amount: true
        }
      }),

      // Recent programs (last 10)
      prisma.program.findMany({
        where: baseWhere,
        include: {
          ward: true,
          fiscalYear: true,
          createdBy: {
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
        take: 10
      }),

      // Pending approvals count
      prisma.programApproval.count({
        where: {
          status: 'pending',
          program: baseWhere
        }
      }),

      // Pending payments count
      prisma.programPayment.count({
        where: {
          status: 'pending',
          program: baseWhere
        }
      }),

      // Monitoring statistics
      prisma.programMonitoring.groupBy({
        by: ['status'],
        where: {
          program: baseWhere
        },
        _count: {
          status: true
        }
      }),

      // Ward statistics (if user has access to multiple wards)
      wardId ? null : prisma.ward.findMany({
        include: {
          _count: {
            select: {
              programs: true
            }
          }
        },
        take: 10
      })
    ]);

    // Calculate budget utilization percentage
    const budgetUtilization = totalBudget._sum.budget
      ? ((Number(totalSpent._sum.amount) || 0) / Number(totalBudget._sum.budget)) * 100
      : 0;

    // Format program status data
    const statusData = programsByStatus.reduce((acc, item) => {
      acc[item.status] = item._count.status;
      return acc;
    }, {} as Record<string, number>);

    // Format monitoring status data
    const monitoringStatusData = monitoringStats.reduce((acc, item) => {
      acc[item.status] = item._count.status;
      return acc;
    }, {} as Record<string, number>);

    // Get program IDs for ward filtering
    let wardProgramIds: string[] = [];
    if (wardId) {
      const wardPrograms = await prisma.program.findMany({
        where: { wardId },
        select: { id: true }
      });
      wardProgramIds = wardPrograms.map(p => p.id);
    }

    // Get recent activities (last 20)
    const recentActivities = await prisma.activityLog.findMany({
      where: wardId ? {
        OR: [
          { entityType: 'program', entityId: { in: wardProgramIds } },
          { userId: session.user.id }
        ]
      } : undefined,
      include: {
        user: {
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
      take: 20
    });

    // Get upcoming deadlines
    const upcomingDeadlines = await prisma.program.findMany({
      where: {
        ...baseWhere,
        endDate: {
          gte: new Date(),
          lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Next 30 days
        }
      },
      include: {
        ward: true,
        fiscalYear: true
      },
      orderBy: {
        endDate: 'asc'
      },
      take: 10
    });

    // Get budget breakdown by program type
    const budgetByProgramType = await prisma.program.groupBy({
      by: ['programTypeId'],
      where: baseWhere,
      _sum: {
        budget: true
      },
      _count: {
        id: true
      }
    });

    // Fetch program type details for budget breakdown
    const programTypeIds = budgetByProgramType.map(item => item.programTypeId).filter(Boolean);
    const programTypes = await prisma.programType.findMany({
      where: {
        id: { in: programTypeIds }
      }
    });

    const budgetBreakdown = budgetByProgramType.map(item => {
      const programType = programTypes.find(pt => pt.id === item.programTypeId);
      return {
        programType: programType?.name || 'Unknown',
        totalBudget: item._sum.budget || 0,
        totalSpent: 0, // TODO: Calculate from payments
        programCount: item._count.id
      };
    });

    return NextResponse.json({
      summary: {
        totalPrograms,
        totalBudget: totalBudget._sum.budget || 0,
        totalSpent: totalSpent._sum.amount || 0,
        budgetUtilization: Math.round(budgetUtilization * 100) / 100,
        pendingApprovals,
        pendingPayments
      },
      programsByStatus: statusData,
      monitoringByStatus: monitoringStatusData,
      recentPrograms,
      recentActivities,
      upcomingDeadlines,
      budgetBreakdown,
      wardStats: wardStats || []
    });

  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
