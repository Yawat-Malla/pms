import { NextResponse } from "next/server";
import { prisma, ensureDbExists } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    await ensureDbExists();

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    const entityType = searchParams.get('entityType');
    const action = searchParams.get('action');

    // Build where clause
    const whereClause: Record<string, unknown> = {};
    
    if (entityType) {
      whereClause.entityType = entityType;
    }
    
    if (action) {
      whereClause.action = action;
    }

    // Fetch activity logs
    const activityLogs = await prisma.activityLog.findMany({
      where: whereClause,
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
      take: limit,
      skip: offset
    });

    // Transform for frontend consumption
    const transformedLogs = activityLogs.map(log => ({
      id: log.id,
      action: formatAction(log.action),
      description: log.description,
      time: getTimeAgo(log.createdAt),
      type: getActivityType(log.action),
      user: log.user?.name || "System",
      entityType: log.entityType,
      entityId: log.entityId,
      metadata: log.metadata,
      createdAt: log.createdAt.toISOString(),
      link: generateEntityLink(log.entityType, log.entityId, log.metadata as Record<string, unknown> || {})
    }));

    // Get total count for pagination
    const totalCount = await prisma.activityLog.count({
      where: whereClause
    });

    return NextResponse.json({
      activityLogs: transformedLogs,
      total: totalCount,
      hasMore: offset + limit < totalCount
    });

  } catch (error) {
    console.error("Error fetching activity logs:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create a new activity log entry
export async function POST(request: Request) {
  try {
    await ensureDbExists();

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action, description, entityType, entityId, userId, metadata } = body;

    // Validation
    if (!action || !description) {
      return NextResponse.json(
        { error: "Action and description are required" },
        { status: 400 }
      );
    }

    const activityLog = await prisma.activityLog.create({
      data: {
        action,
        description,
        entityType,
        entityId,
        userId,
        metadata
      }
    });

    return NextResponse.json({ activityLog }, { status: 201 });

  } catch (error) {
    console.error("Error creating activity log:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper functions
function formatAction(action: string): string {
  return action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function getActivityType(action: string): string {
  if (action.includes('upload')) return 'upload';
  if (action.includes('approval')) return 'approval';
  if (action.includes('reject')) return 'rejection';
  if (action.includes('submit')) return 'submission';
  if (action.includes('create')) return 'creation';
  if (action.includes('update')) return 'update';
  if (action.includes('delete')) return 'deletion';
  return 'other';
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return `${diffInSeconds}s ago`;
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}m ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}d ago`;
  }
}

function generateEntityLink(entityType: string | null, entityId: string | null, metadata: Record<string, unknown>): string {
  if (!entityType || !entityId) return '#';

  switch (entityType) {
    case 'program':
      return `/programs/${entityId}`;
    case 'approval':
      // Try to get program ID from metadata
      const programId = metadata?.programId;
      return programId ? `/programs/${programId}` : '/approvals';
    case 'payment':
      return '/payments';
    case 'document':
      return metadata?.programId ? `/programs/${metadata.programId}` : '#';
    default:
      return '#';
  }
}
