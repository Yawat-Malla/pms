import { NextRequest, NextResponse } from "next/server";
import { prisma, ensureDbExists } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ProgramStatus } from "@prisma/client";

// GET analytics data
export async function GET(request: NextRequest) {
  try {
    await ensureDbExists();

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'overview';
    const wardId = searchParams.get('wardId') || session.user.wardId;
    const fiscalYearId = searchParams.get('fiscalYearId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build base where clause
    const baseWhere: Record<string, unknown> = {};
    if (wardId) {
      baseWhere.wardId = wardId;
    }
    if (fiscalYearId) {
      baseWhere.fiscalYearId = fiscalYearId;
    }

    // Add date range filter if provided
    const dateFilter: Record<string, unknown> = {};
    if (startDate || endDate) {
      const createdAtFilter: Record<string, Date> = {};
      if (startDate) {
        createdAtFilter.gte = new Date(startDate);
      }
      if (endDate) {
        createdAtFilter.lte = new Date(endDate);
      }
      dateFilter.createdAt = createdAtFilter;
    }

    const whereWithDate = { ...baseWhere, ...dateFilter };

    switch (type) {
      case 'budget':
        return await getBudgetAnalytics(baseWhere, whereWithDate);
      
      case 'performance':
        return await getPerformanceAnalytics(baseWhere, whereWithDate);
      
      case 'timeline':
        return await getTimelineAnalytics(baseWhere, whereWithDate);
      
      case 'ward-comparison':
        return await getWardComparisonAnalytics(fiscalYearId);
      
      case 'trends':
        return await getTrendsAnalytics(baseWhere);
      
      default:
        return await getOverviewAnalytics(baseWhere, whereWithDate);
    }

  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function getOverviewAnalytics(baseWhere: Record<string, unknown>, whereWithDate: Record<string, unknown>) {
  const [
    totalPrograms,
    completedPrograms,
    totalBudget,
    totalSpent,
    programsByMonth
  ] = await Promise.all([
    prisma.program.count({ where: baseWhere }),
    prisma.program.count({ where: { ...baseWhere, status: ProgramStatus.CLOSED } }),
    prisma.program.aggregate({ where: baseWhere, _sum: { budget: true } }),
    prisma.programPayment.aggregate({
      where: {
        program: baseWhere,
        status: 'approved'
      },
      _sum: { amount: true }
    }),
    prisma.program.findMany({
      where: whereWithDate,
      select: {
        createdAt: true,
        status: true
      }
    })
  ]);

  // Group programs by month
  const monthlyData = programsByMonth.reduce((acc, program) => {
    const month = program.createdAt.toISOString().substring(0, 7); // YYYY-MM
    if (!acc[month]) {
      acc[month] = { total: 0, completed: 0 };
    }
    acc[month].total++;
    if (program.status === ProgramStatus.CLOSED) {
      acc[month].completed++;
    }
    return acc;
  }, {} as Record<string, { total: number; completed: number }>);

  return NextResponse.json({
    overview: {
      totalPrograms,
      completedPrograms,
      completionRate: totalPrograms > 0 ? (completedPrograms / totalPrograms) * 100 : 0,
      totalBudget: totalBudget._sum.budget || 0,
      totalSpent: Number(totalSpent._sum.amount) || 0,
      budgetUtilization: totalBudget._sum.budget ? ((Number(totalSpent._sum.amount) || 0) / Number(totalBudget._sum.budget)) * 100 : 0,
      averageProgress: 0 // TODO: Calculate from monitoring data
    },
    monthlyTrends: monthlyData
  });
}

async function getBudgetAnalytics(baseWhere: Record<string, unknown>, whereWithDate: Record<string, unknown>) {
  const [
    budgetByProgramType,
    budgetByWard,
    paymentsByCategory,
    budgetUtilizationOverTime
  ] = await Promise.all([
    prisma.program.groupBy({
      by: ['programTypeId'],
      where: baseWhere,
      _sum: { budget: true },
      _count: { id: true }
    }),
    prisma.program.groupBy({
      by: ['wardId'],
      where: baseWhere,
      _sum: { budget: true },
      _count: { id: true }
    }),
    prisma.programPayment.groupBy({
      by: ['purpose'],
      where: { program: baseWhere },
      _sum: { amount: true },
      _count: { id: true }
    }),
    prisma.programPayment.findMany({
      where: { program: whereWithDate },
      select: {
        amount: true,
        createdAt: true,
        status: true
      },
      orderBy: { createdAt: 'asc' }
    })
  ]);

  return NextResponse.json({
    budgetByProgramType,
    budgetByWard,
    paymentsByCategory,
    budgetUtilizationOverTime
  });
}

async function getPerformanceAnalytics(baseWhere: Record<string, unknown>, whereWithDate: Record<string, unknown>) {
  const [
    programsOnTrack,
    programsAtRisk,
    programsDelayed,
    averageCompletionTime,
    performanceByWard
  ] = await Promise.all([
    prisma.programMonitoring.count({ where: { program: baseWhere, status: 'completed' } }),
    prisma.programMonitoring.count({ where: { program: baseWhere, status: 'scheduled' } }),
    prisma.programMonitoring.count({ where: { program: baseWhere, status: 'cancelled' } }),
    prisma.program.findMany({
      where: { ...baseWhere, status: ProgramStatus.CLOSED },
      select: {
        createdAt: true,
        updatedAt: true
      }
    }),
    prisma.program.groupBy({
      by: ['wardId'],
      where: baseWhere,
      _avg: { budget: true },
      _count: { id: true }
    })
  ]);

  // Calculate average completion time
  const completionTimes = averageCompletionTime.map(program => {
    const diffTime = Math.abs(program.updatedAt.getTime() - program.createdAt.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Convert to days
  });

  const avgCompletionDays = completionTimes.length > 0 
    ? completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length 
    : 0;

  return NextResponse.json({
    performance: {
      completed: programsOnTrack,
      scheduled: programsAtRisk,
      cancelled: programsDelayed,
      averageCompletionDays: Math.round(avgCompletionDays)
    },
    performanceByWard
  });
}

async function getTimelineAnalytics(baseWhere: Record<string, unknown>, whereWithDate: Record<string, unknown>) {
  const [
    upcomingDeadlines,
    overduePrograms,
    programsByQuarter
  ] = await Promise.all([
    prisma.program.findMany({
      where: {
        ...baseWhere,
        endDate: {
          gte: new Date(),
          lte: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // Next 90 days
        }
      },
      include: { ward: true },
      orderBy: { endDate: 'asc' }
    }),
    prisma.program.count({
      where: {
        ...baseWhere,
        endDate: { lt: new Date() },
        status: { not: ProgramStatus.CLOSED }
      }
    }),
    prisma.program.findMany({
      where: whereWithDate,
      select: {
        createdAt: true,
        endDate: true,
        status: true
      }
    })
  ]);

  return NextResponse.json({
    upcomingDeadlines,
    overduePrograms,
    programsByQuarter
  });
}

async function getWardComparisonAnalytics(fiscalYearId: string | null) {
  const whereClause = fiscalYearId ? { fiscalYearId } : {};
  
  const wardComparison = await prisma.ward.findMany({
    include: {
      programs: {
        where: whereClause,
        include: {
          _count: {
            select: {
              payments: true,
              monitoring: true
            }
          }
        }
      },
      _count: {
        select: {
          programs: {
            where: whereClause
          }
        }
      }
    }
  });

  const wardStats = wardComparison.map(ward => ({
    ward: {
      id: ward.id,
      name: ward.name,
      code: ward.code
    },
    totalPrograms: ward._count.programs,
    totalBudget: ward.programs.reduce((sum, p) => sum + (Number(p.budget) || 0), 0),
    totalSpent: 0, // TODO: Calculate from payments
    completedPrograms: ward.programs.filter(p => p.status === ProgramStatus.CLOSED).length,
    averageProgress: ward.programs.length > 0
      ? ward.programs.reduce((sum, p) => sum + (Number(p.budget) || 0), 0) / ward.programs.length
      : 0
  }));

  return NextResponse.json({ wardComparison: wardStats });
}

async function getTrendsAnalytics(baseWhere: Record<string, unknown>) {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const trends = await prisma.program.findMany({
    where: {
      ...baseWhere,
      createdAt: { gte: sixMonthsAgo }
    },
    select: {
      createdAt: true,
      status: true,
      budget: true
    },
    orderBy: { createdAt: 'asc' }
  });

  return NextResponse.json({ trends });
}
