import { NextResponse } from "next/server";
import { prisma, ensureDbExists } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    await ensureDbExists();

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current fiscal year
    const currentFiscalYear = await prisma.fiscalYear.findFirst({
      where: { isActive: true }
    });

    if (!currentFiscalYear) {
      return NextResponse.json(
        { error: "No active fiscal year found" },
        { status: 400 }
      );
    }

    // Get user's ward for filtering (if applicable)
    const userWardId = session.user.wardId;

    // Build where clause for programs based on user's ward
    const programWhereClause = userWardId
      ? { fiscalYearId: currentFiscalYear.id, wardId: userWardId }
      : { fiscalYearId: currentFiscalYear.id };

    // Get total programs for current fiscal year
    const totalPrograms = await prisma.program.count({
      where: programWhereClause
    });

    // Get pending approvals count
    const pendingApprovals = await prisma.programApproval.count({
      where: {
        status: "pending",
        program: userWardId ? { wardId: userWardId } : {}
      }
    });

    // Get budget statistics
    const budgetStats = await prisma.program.aggregate({
      where: programWhereClause,
      _sum: {
        budget: true
      }
    });

    // Get total spent from payments
    const spentStats = await prisma.programPayment.aggregate({
      where: {
        status: "approved",
        program: userWardId ? { wardId: userWardId } : {}
      },
      _sum: {
        amount: true
      }
    });

    // Get pending payments count and amount
    const pendingPayments = await prisma.programPayment.aggregate({
      where: {
        status: "pending",
        program: userWardId ? { wardId: userWardId } : {}
      },
      _count: true,
      _sum: {
        amount: true
      }
    });

    // Calculate budget data
    const allocatedBudget = Number(budgetStats._sum.budget || 0);
    const spentBudget = Number(spentStats._sum.amount || 0);
    const budgetPercentage = allocatedBudget > 0 ? Math.round((spentBudget / allocatedBudget) * 100) : 0;

    // Format currency helper
    const formatCurrency = (amount: number) => {
      if (amount >= 1000000) {
        return `₦${(amount / 1000000).toFixed(1)}M`;
      } else if (amount >= 1000) {
        return `₦${(amount / 1000).toFixed(0)}K`;
      } else {
        return `₦${amount.toLocaleString()}`;
      }
    };

    const stats = {
      totalPrograms: {
        value: totalPrograms,
        change: "+12%", // TODO: Calculate from previous period
        changeType: "positive" as const
      },
      pendingApprovals: {
        value: pendingApprovals,
        change: "+5",
        changeType: "negative" as const
      },
      budget: {
        allocated: allocatedBudget,
        spent: spentBudget,
        percentage: budgetPercentage,
        formattedAllocated: formatCurrency(allocatedBudget),
        formattedSpent: formatCurrency(spentBudget)
      },
      pendingPayments: {
        count: pendingPayments._count,
        amount: Number(pendingPayments._sum.amount || 0),
        formattedAmount: formatCurrency(Number(pendingPayments._sum.amount || 0))
      },
      fiscalYear: currentFiscalYear.year
    };

    return NextResponse.json({ stats });

  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
