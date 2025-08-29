import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma, ensureDbExists } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    await ensureDbExists();

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userWardId = session.user.wardId;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '5');

    // Build where clause based on user's ward
    const whereClause = userWardId ? { wardId: userWardId } : {};

    // Get recent programs
    const programs = await prisma.program.findMany({
      where: whereClause,
      include: {
        ward: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        fiscalYear: {
          select: {
            id: true,
            year: true,
            isActive: true
          }
        },
        programType: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            documents: true,
            approvals: true,
            payments: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    });

    // Format programs for frontend
    const formattedPrograms = programs.map(program => ({
      id: program.id,
      code: program.code,
      name: program.name,
      description: program.description,
      status: program.status,
      budget: program.budget ? Number(program.budget) : 0,
      startDate: program.startDate,
      endDate: program.endDate,
      ward: program.ward,
      fiscalYear: program.fiscalYear,
      programType: program.programType,
      createdBy: program.createdBy,
      createdAt: program.createdAt,
      updatedAt: program.updatedAt,
      counts: {
        documents: program._count.documents,
        approvals: program._count.approvals,
        payments: program._count.payments
      },
      timeAgo: getTimeAgo(program.createdAt)
    }));

    return NextResponse.json({
      programs: formattedPrograms
    });

  } catch (error) {
    console.error("Error fetching recent programs:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return `${diffInSeconds} seconds ago`;
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else {
    const months = Math.floor(diffInSeconds / 2592000);
    return `${months} month${months > 1 ? 's' : ''} ago`;
  }
}
