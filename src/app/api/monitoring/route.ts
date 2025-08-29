import { NextRequest, NextResponse } from "next/server";
import { prisma, ensureDbExists } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const createMonitoringSchema = z.object({
  programId: z.string().min(1, "Program ID is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  status: z.enum(["on_track", "at_risk", "delayed", "completed"]).default("on_track"),
  progressPercentage: z.number().min(0).max(100).default(0),
  milestones: z.array(z.object({
    name: z.string(),
    targetDate: z.string(),
    status: z.enum(["pending", "in_progress", "completed", "overdue"]),
    description: z.string().optional()
  })).default([]),
  challenges: z.string().optional(),
  nextSteps: z.string().optional(),
  budgetUtilization: z.number().min(0).max(100).optional()
});

const updateMonitoringSchema = z.object({
  id: z.string().min(1, "Monitoring ID is required"),
  title: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(["on_track", "at_risk", "delayed", "completed"]).optional(),
  progressPercentage: z.number().min(0).max(100).optional(),
  milestones: z.array(z.object({
    name: z.string(),
    targetDate: z.string(),
    status: z.enum(["pending", "in_progress", "completed", "overdue"]),
    description: z.string().optional()
  })).optional(),
  challenges: z.string().optional(),
  nextSteps: z.string().optional(),
  budgetUtilization: z.number().min(0).max(100).optional()
});

// GET monitoring records
export async function GET(request: NextRequest) {
  try {
    await ensureDbExists();

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const programId = searchParams.get('programId');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Build where clause
    const whereClause: Record<string, unknown> = {};

    if (programId) {
      whereClause.programId = programId;
    }

    if (status) {
      whereClause.status = status;
    }

    // Filter by user's ward if they have one
    if (session.user.wardId && !programId) {
      whereClause.program = {
        wardId: session.user.wardId
      };
    }

    const skip = (page - 1) * limit;

    const [monitoringRecords, totalCount] = await Promise.all([
      prisma.programMonitoring.findMany({
        where: whereClause,
        include: {
          program: {
            include: {
              ward: true,
              fiscalYear: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.programMonitoring.count({ where: whereClause })
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      monitoring: monitoringRecords,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    });

  } catch (error) {
    console.error("Error fetching monitoring records:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create a new monitoring record
export async function POST(request: Request) {
  try {
    await ensureDbExists();

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createMonitoringSchema.parse(body);

    // Check if program exists
    const program = await prisma.program.findUnique({
      where: { id: validatedData.programId },
      include: { ward: true }
    });

    if (!program) {
      return NextResponse.json(
        { error: "Program not found" },
        { status: 404 }
      );
    }

    // Check if user has permission to create monitoring records for this program
    if (program.createdById !== session.user.id && session.user.wardId !== program.wardId) {
      return NextResponse.json(
        { error: "You don't have permission to create monitoring records for this program" },
        { status: 403 }
      );
    }

    // Process milestones - convert date strings to Date objects
    const processedMilestones = validatedData.milestones.map(milestone => ({
      ...milestone,
      targetDate: new Date(milestone.targetDate)
    }));

    // Create the monitoring record
    const monitoring = await prisma.programMonitoring.create({
      data: {
        programId: validatedData.programId,
        type: validatedData.type || 'progress_review',
        inspector: validatedData.inspector || session.user.name || 'Unknown',
        status: validatedData.status,
        comments: validatedData.description,
        reportDate: new Date(validatedData.reportDate || new Date())
      },
      include: {
        program: {
          include: {
            ward: true,
            fiscalYear: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "monitoring_created",
        description: `Monitoring record created for program: ${program.name} - ${validatedData.title}`,
        entityType: "monitoring",
        entityId: monitoring.id,
        userId: session.user.id
      }
    });

    return NextResponse.json({ monitoring }, { status: 201 });

  } catch (error) {
    console.error("Error creating monitoring record:", error);
    
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

// PUT - Update monitoring record
export async function PUT(request: Request) {
  try {
    await ensureDbExists();

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateMonitoringSchema.parse(body);

    // Check if monitoring record exists
    const existingMonitoring = await prisma.monitoring.findUnique({
      where: { id: validatedData.id },
      include: {
        program: true
      }
    });

    if (!existingMonitoring) {
      return NextResponse.json(
        { error: "Monitoring record not found" },
        { status: 404 }
      );
    }

    // Check permissions
    if (existingMonitoring.createdById !== session.user.id) {
      // TODO: Add proper role-based access control
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {};

    if (validatedData.title) updateData.title = validatedData.title;
    if (validatedData.description) updateData.description = validatedData.description;
    if (validatedData.status) updateData.status = validatedData.status;
    if (validatedData.progressPercentage !== undefined) updateData.progressPercentage = validatedData.progressPercentage;
    if (validatedData.challenges !== undefined) updateData.challenges = validatedData.challenges;
    if (validatedData.nextSteps !== undefined) updateData.nextSteps = validatedData.nextSteps;
    if (validatedData.budgetUtilization !== undefined) updateData.budgetUtilization = validatedData.budgetUtilization;

    // Process milestones if provided
    if (validatedData.milestones) {
      const processedMilestones = validatedData.milestones.map(milestone => ({
        ...milestone,
        targetDate: new Date(milestone.targetDate)
      }));
      updateData.milestones = processedMilestones;
    }

    // Update the monitoring record
    const updatedMonitoring = await prisma.monitoring.update({
      where: { id: validatedData.id },
      data: updateData,
      include: {
        program: {
          include: {
            ward: true,
            fiscalYear: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "monitoring_updated",
        description: `Monitoring record updated: ${updatedMonitoring.title}`,
        entityType: "monitoring",
        entityId: updatedMonitoring.id,
        userId: session.user.id
      }
    });

    return NextResponse.json({
      message: "Monitoring record updated successfully",
      monitoring: updatedMonitoring
    });

  } catch (error) {
    console.error("Error updating monitoring record:", error);

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

// DELETE - Delete monitoring record
export async function DELETE(request: NextRequest) {
  try {
    await ensureDbExists();

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: "Monitoring ID is required" },
        { status: 400 }
      );
    }

    // Check if monitoring record exists
    const existingMonitoring = await prisma.monitoring.findUnique({
      where: { id },
      include: {
        program: true
      }
    });

    if (!existingMonitoring) {
      return NextResponse.json(
        { error: "Monitoring record not found" },
        { status: 404 }
      );
    }

    // Check permissions - only creator can delete
    if (existingMonitoring.createdById !== session.user.id) {
      return NextResponse.json(
        { error: "You don't have permission to delete this monitoring record" },
        { status: 403 }
      );
    }

    // Delete the monitoring record
    await prisma.monitoring.delete({
      where: { id }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "monitoring_deleted",
        description: `Monitoring record deleted: ${existingMonitoring.title}`,
        entityType: "monitoring",
        entityId: id,
        userId: session.user.id
      }
    });

    return NextResponse.json({ message: "Monitoring record deleted successfully" });

  } catch (error) {
    console.error("Error deleting monitoring record:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
