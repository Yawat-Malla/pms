import { NextResponse } from "next/server";
import { prisma, ensureDbExists } from "@/lib/prisma";
import { z } from "zod";

// Validation schema for creating notifications
const createNotificationSchema = z.object({
  title: z.string().min(1, "Title is required"),
  message: z.string().min(1, "Message is required"),
  type: z.enum(["deadline", "approval", "payment", "info", "warning", "error"]),
  priority: z.enum(["low", "medium", "high"]),
  userId: z.string().optional(),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  expiresAt: z.string().optional()
});

// GET - Fetch notifications
export async function GET(request: Request) {
  try {
    await ensureDbExists();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const isRead = searchParams.get('isRead');
    const type = searchParams.get('type');
    const priority = searchParams.get('priority');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build where clause
    const whereClause: Record<string, unknown> = {
      // Only show non-expired notifications
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } }
      ]
    };

    if (userId) {
      whereClause.OR = [
        { userId: userId },
        { userId: null } // System-wide notifications
      ];
    }

    if (isRead !== null) {
      whereClause.isRead = isRead === 'true';
    }

    if (type) {
      whereClause.type = type;
    }

    if (priority) {
      whereClause.priority = priority;
    }

    // Fetch notifications
    const notifications = await prisma.notification.findMany({
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
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ],
      take: limit,
      skip: offset
    });

    // Transform for frontend
    const transformedNotifications = notifications.map(notification => ({
      id: notification.id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      priority: notification.priority,
      isRead: notification.isRead,
      isSystemWide: !notification.userId,
      entityType: notification.entityType,
      entityId: notification.entityId,
      expiresAt: notification.expiresAt?.toISOString(),
      createdAt: notification.createdAt.toISOString(),
      timeAgo: getTimeAgo(notification.createdAt),
      user: notification.user
    }));

    // Get unread count
    const unreadCount = await prisma.notification.count({
      where: {
        ...whereClause,
        isRead: false
      }
    });

    return NextResponse.json({
      notifications: transformedNotifications,
      unreadCount,
      total: transformedNotifications.length
    });

  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create a new notification
export async function POST(request: Request) {
  try {
    await ensureDbExists();

    const body = await request.json();
    const validatedData = createNotificationSchema.parse(body);

    const notification = await prisma.notification.create({
      data: {
        title: validatedData.title,
        message: validatedData.message,
        type: validatedData.type,
        priority: validatedData.priority,
        userId: validatedData.userId,
        entityType: validatedData.entityType,
        entityId: validatedData.entityId,
        expiresAt: validatedData.expiresAt ? new Date(validatedData.expiresAt) : null
      }
    });

    return NextResponse.json({ notification }, { status: 201 });

  } catch (error) {
    console.error("Error creating notification:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Mark notifications as read
export async function PUT(request: Request) {
  try {
    await ensureDbExists();

    const body = await request.json();
    const { notificationIds, markAllAsRead, userId } = body;

    if (markAllAsRead && userId) {
      // Mark all notifications for user as read
      await prisma.notification.updateMany({
        where: {
          OR: [
            { userId: userId },
            { userId: null }
          ],
          isRead: false
        },
        data: {
          isRead: true
        }
      });

      return NextResponse.json({ success: true, message: "All notifications marked as read" });
    } else if (notificationIds && Array.isArray(notificationIds)) {
      // Mark specific notifications as read
      await prisma.notification.updateMany({
        where: {
          id: { in: notificationIds }
        },
        data: {
          isRead: true
        }
      });

      return NextResponse.json({ success: true, message: "Notifications marked as read" });
    } else {
      return NextResponse.json(
        { error: "Invalid request. Provide either notificationIds or markAllAsRead with userId" },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error("Error updating notifications:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete notifications
export async function DELETE(request: Request) {
  try {
    await ensureDbExists();

    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get('id');

    if (!notificationId) {
      return NextResponse.json(
        { error: "Notification ID is required" },
        { status: 400 }
      );
    }

    await prisma.notification.delete({
      where: { id: notificationId }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Error deleting notification:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper function
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
