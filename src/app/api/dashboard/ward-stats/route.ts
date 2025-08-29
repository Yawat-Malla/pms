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

    const fiscalYearFilter = currentFiscalYear 
      ? { fiscalYearId: currentFiscalYear.id }
      : {};

    // Get ward statistics with program counts and budget info
    const wardStats = await prisma.ward.findMany({
      include: {
        programs: {
          where: fiscalYearFilter,
          include: {
            payments: {
              where: { status: "approved" }
            }
          }
        }
      },
      orderBy: {
        code: 'asc'
      }
    });

    // Process the data to calculate statistics for each ward
    const processedStats = wardStats.map(ward => {
      const programs = ward.programs;
      const programCount = programs.length;
      
      // Calculate total budget for this ward
      const totalBudget = programs.reduce((sum, program) => {
        return sum + (Number(program.budget) || 0);
      }, 0);

      // Calculate total spent from payments
      const totalSpent = programs.reduce((sum, program) => {
        const programSpent = program.payments
          .filter(payment => payment.status === 'approved')
          .reduce((paymentSum, payment) => paymentSum + Number(payment.amount), 0);
        return sum + programSpent;
      }, 0);

      return {
        ward: `Ward ${ward.code}`,
        wardName: ward.name,
        programs: programCount,
        budget: `₦${(totalBudget / 1000000).toFixed(1)}M`,
        spent: `₦${(totalSpent / 1000000).toFixed(1)}M`,
        budgetRaw: totalBudget,
        spentRaw: totalSpent,
        spentPercentage: totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0
      };
    });

    // Filter out wards with no programs if needed, or include all for completeness
    const filteredStats = processedStats.filter(stat => stat.programs > 0);

    return NextResponse.json({ 
      wardStats: filteredStats,
      fiscalYear: currentFiscalYear?.year || "No active fiscal year"
    });

  } catch (error) {
    console.error("Error fetching ward stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
