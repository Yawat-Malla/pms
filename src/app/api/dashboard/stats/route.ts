import { NextResponse } from "next/server";
import { prisma, ensureDbExists } from "@/lib/prisma";

export async function GET() {
  try {
    await ensureDbExists();

    // Get current fiscal year
    const currentFiscalYear = await prisma.fiscalYear.findFirst({
      where: { isActive: true }
    });

    const fiscalYearFilter = currentFiscalYear 
      ? { fiscalYearId: currentFiscalYear.id }
      : {};

    // Get total programs for current fiscal year
    const totalPrograms = await prisma.program.count({
      where: fiscalYearFilter
    });

    // Get pending approvals count
    const pendingApprovals = await prisma.programApproval.count({
      where: { 
        status: "pending",
        program: fiscalYearFilter
      }
    });

    // Get budget statistics
    const budgetStats = await prisma.program.aggregate({
      where: fiscalYearFilter,
      _sum: {
        budget: true
      }
    });

    // Get spent amount (sum of approved payments)
    const spentStats = await prisma.programPayment.aggregate({
      where: {
        status: "approved",
        program: fiscalYearFilter
      },
      _sum: {
        amount: true
      }
    });

    // Get pending payments count and amount
    const pendingPayments = await prisma.programPayment.aggregate({
      where: {
        status: "pending",
        program: fiscalYearFilter
      },
      _count: {
        id: true
      },
      _sum: {
        amount: true
      }
    });

    // Calculate percentage change (mock data for now - would need historical data)
    const totalBudget = Number(budgetStats._sum.budget || 0);
    const totalSpent = Number(spentStats._sum.amount || 0);
    const spentPercentage = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

    const stats = {
      totalPrograms: {
        value: totalPrograms,
        change: "+12%", // Mock data - would calculate from previous period
        changeType: "positive" as const
      },
      pendingApprovals: {
        value: pendingApprovals,
        change: "+5",
        changeType: "negative" as const
      },
      budget: {
        allocated: Number(totalBudget),
        spent: Number(totalSpent),
        percentage: spentPercentage,
        formattedAllocated: `Rs. ${(Number(totalBudget) / 1000000).toFixed(1)}M`,
        formattedSpent: `Rs. ${(Number(totalSpent) / 1000000).toFixed(1)}M`
      },
      pendingPayments: {
        count: pendingPayments._count.id,
        amount: Number(pendingPayments._sum.amount || 0),
        formattedAmount: `Rs. ${(Number(pendingPayments._sum.amount || 0) / 1000000).toFixed(1)}M`
      },
      fiscalYear: currentFiscalYear?.year || "No active fiscal year"
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
