import { NextRequest, NextResponse } from "next/server";
import { prisma, ensureDbExists } from "@/lib/prisma";
import { z } from "zod";

// Validation schema for monitoring entry
const createMonitoringSchema = z.object({
  type: z.enum(["site_inspection", "progress_review", "quality_check", "milestone_review", "final_inspection"]),
  inspector: z.string().min(1, "Inspector name is required"),
  status: z.enum(["scheduled", "completed", "cancelled"]),
  comments: z.string().optional(),
  photos: z.array(z.string()).default([]),
  reportDate: z.string().min(1, "Report date is required")
});

// Validation schema for updating monitoring
const updateMonitoringSchema = z.object({
  monitoringId: z.string().min(1, "Monitoring ID is required"),
  type: z.enum(["site_inspection", "progress_review", "quality_check", "milestone_review", "final_inspection"]).optional(),
  inspector: z.string().optional(),
  status: z.enum(["scheduled", "completed", "cancelled"]).optional(),
  comments: z.string().optional(),
  photos: z.array(z.string()).optional(),
  reportDate: z.string().optional()
});

// GET - Fetch monitoring entries for a program
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDbExists();

    const { id: programId } = await params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');

    // Verify program exists
    const program = await prisma.program.findUnique({
      where: { id: programId }
    });

    if (!program) {
      return NextResponse.json(
        { error: "Program not found" },
        { status: 404 }
      );
    }

    // Build where clause
    const whereClause: Record<string, unknown> = { programId };
    if (type) {
      whereClause.type = type;
    }
    if (status) {
      whereClause.status = status;
    }

    // Fetch monitoring entries
    const monitoringEntries = await prisma.programMonitoring.findMany({
      where: whereClause,
      orderBy: {
        reportDate: 'desc'
      }
    });

    // Transform for frontend
    const transformedEntries = monitoringEntries.map(entry => ({
      id: entry.id,
      type: entry.type,
      typeLabel: getTypeLabel(entry.type),
      inspector: entry.inspector,
      status: entry.status,
      statusLabel: getStatusLabel(entry.status),
      comments: entry.comments,
      photos: entry.photos,
      reportDate: entry.reportDate.toISOString().split('T')[0],
      createdAt: entry.createdAt.toISOString(),
      timeAgo: getTimeAgo(entry.createdAt),
      isOverdue: entry.status === 'scheduled' && new Date(entry.reportDate) < new Date()
    }));

    // Calculate summary statistics
    const summary = {
      total: transformedEntries.length,
      scheduled: transformedEntries.filter(e => e.status === 'scheduled').length,
      completed: transformedEntries.filter(e => e.status === 'completed').length,
      cancelled: transformedEntries.filter(e => e.status === 'cancelled').length,
      overdue: transformedEntries.filter(e => e.isOverdue).length,
      byType: transformedEntries.reduce((acc: Record<string, number>, entry) => {
        acc[entry.type] = (acc[entry.type] || 0) + 1;
        return acc;
      }, {})
    };

    return NextResponse.json({ 
      monitoring: transformedEntries,
      summary,
      programId: programId
    });

  } catch (error) {
    console.error("Error fetching program monitoring:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create a new monitoring entry
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDbExists();

    const { id: programId } = await params;
    const body = await request.json();
    
    // Validate input
    const validatedData = createMonitoringSchema.parse(body);

    // Verify program exists
    const program = await prisma.program.findUnique({
      where: { id: programId }
    });

    if (!program) {
      return NextResponse.json(
        { error: "Program not found" },
        { status: 404 }
      );
    }

    // Create monitoring entry
    const monitoring = await prisma.programMonitoring.create({
      data: {
        programId: programId,
        type: validatedData.type,
        inspector: validatedData.inspector,
        status: validatedData.status,
        comments: validatedData.comments,
        photos: validatedData.photos,
        reportDate: new Date(validatedData.reportDate)
      }
    });

    // Create activity log
    await prisma.activityLog.create({
      data: {
        action: "monitoring_created",
        description: `${getTypeLabel(validatedData.type)} scheduled for program ${program.name} by ${validatedData.inspector}`,
        entityType: "monitoring",
        entityId: monitoring.id,
        metadata: {
          programId: programId,
          type: validatedData.type,
          inspector: validatedData.inspector,
          reportDate: validatedData.reportDate
        }
      }
    });

    // Create notification if this is a scheduled inspection
    if (validatedData.status === 'scheduled') {
      const reportDate = new Date(validatedData.reportDate);
      const today = new Date();
      const daysUntilReport = Math.ceil((reportDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (daysUntilReport <= 7) {
        await prisma.notification.create({
          data: {
            title: "Upcoming Monitoring Activity",
            message: `${getTypeLabel(validatedData.type)} scheduled for ${reportDate.toLocaleDateString()} for program ${program.name}`,
            type: "deadline",
            priority: daysUntilReport <= 3 ? "high" : "medium",
            entityType: "monitoring",
            entityId: monitoring.id,
            expiresAt: reportDate
          }
        });
      }
    }

    return NextResponse.json(
      { 
        message: "Monitoring entry created successfully",
        monitoring: {
          id: monitoring.id,
          type: monitoring.type,
          typeLabel: getTypeLabel(monitoring.type),
          inspector: monitoring.inspector,
          status: monitoring.status,
          statusLabel: getStatusLabel(monitoring.status),
          comments: monitoring.comments,
          photos: monitoring.photos,
          reportDate: monitoring.reportDate.toISOString().split('T')[0],
          createdAt: monitoring.createdAt.toISOString(),
          timeAgo: getTimeAgo(monitoring.createdAt),
          isOverdue: monitoring.status === 'scheduled' && new Date(monitoring.reportDate) < new Date()
        }
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("Error creating monitoring entry:", error);
    
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

// PUT - Update a monitoring entry
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDbExists();

    const { id: programId } = await params;
    const body = await request.json();
    
    // Validate input
    const validatedData = updateMonitoringSchema.parse(body);

    // Find the monitoring entry
    const monitoring = await prisma.programMonitoring.findFirst({
      where: {
        id: validatedData.monitoringId,
        programId: programId
      },
      include: {
        program: true
      }
    });

    if (!monitoring) {
      return NextResponse.json(
        { error: "Monitoring entry not found" },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {};
    if (validatedData.type) updateData.type = validatedData.type;
    if (validatedData.inspector) updateData.inspector = validatedData.inspector;
    if (validatedData.status) updateData.status = validatedData.status;
    if (validatedData.comments !== undefined) updateData.comments = validatedData.comments;
    if (validatedData.photos) updateData.photos = validatedData.photos;
    if (validatedData.reportDate) updateData.reportDate = new Date(validatedData.reportDate);

    // Update monitoring entry
    const updatedMonitoring = await prisma.programMonitoring.update({
      where: { id: validatedData.monitoringId },
      data: updateData
    });

    // Create activity log
    await prisma.activityLog.create({
      data: {
        action: "monitoring_updated",
        description: `Monitoring entry updated for program ${monitoring.program.name}`,
        entityType: "monitoring",
        entityId: monitoring.id,
        metadata: JSON.parse(JSON.stringify({
          programId: programId,
          changes: updateData
        }))
      }
    });

    return NextResponse.json({ 
      success: true,
      monitoring: {
        id: updatedMonitoring.id,
        type: updatedMonitoring.type,
        typeLabel: getTypeLabel(updatedMonitoring.type),
        inspector: updatedMonitoring.inspector,
        status: updatedMonitoring.status,
        statusLabel: getStatusLabel(updatedMonitoring.status),
        comments: updatedMonitoring.comments,
        photos: updatedMonitoring.photos,
        reportDate: updatedMonitoring.reportDate.toISOString().split('T')[0],
        createdAt: updatedMonitoring.createdAt.toISOString(),
        timeAgo: getTimeAgo(updatedMonitoring.createdAt),
        isOverdue: updatedMonitoring.status === 'scheduled' && new Date(updatedMonitoring.reportDate) < new Date()
      }
    });

  } catch (error) {
    console.error("Error updating monitoring entry:", error);
    
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

// Helper functions
function getTypeLabel(type: string): string {
  switch (type) {
    case "site_inspection": return "Site Inspection";
    case "progress_review": return "Progress Review";
    case "quality_check": return "Quality Check";
    case "milestone_review": return "Milestone Review";
    case "final_inspection": return "Final Inspection";
    default: return type;
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case "scheduled": return "Scheduled";
    case "completed": return "Completed";
    case "cancelled": return "Cancelled";
    default: return status;
  }
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
