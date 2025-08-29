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
    const limit = parseInt(searchParams.get('limit') || '10');

    // Get recent activity logs
    let programIds: string[] = [];
    if (userWardId) {
      // Get program IDs for the user's ward
      const wardPrograms = await prisma.program.findMany({
        where: { wardId: userWardId },
        select: { id: true }
      });
      programIds = wardPrograms.map(p => p.id);
    }

    const activities = await prisma.activityLog.findMany({
      where: userWardId ? {
        OR: [
          { userId: session.user.id },
          {
            entityType: "program",
            entityId: { in: programIds }
          }
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
      take: limit
    });

    // Format activities for frontend
    const formattedActivities = activities.map(activity => ({
      id: activity.id,
      action: activity.action,
      description: activity.description,
      entityType: activity.entityType,
      entityId: activity.entityId,
      user: activity.user,
      createdAt: activity.createdAt,
      timeAgo: getTimeAgo(activity.createdAt)
    }));

    return NextResponse.json({
      activities: formattedActivities
    });

  } catch (error) {
    console.error("Error fetching recent activity:", error);
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
