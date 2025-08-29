import { NextResponse } from "next/server";
import { prisma, ensureDbExists } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import { ProgramStatus } from "@prisma/client";

// Validation schema for approval actions
const approvalActionSchema = z.object({
  approvalId: z.string().min(1, "Approval ID is required"),
  action: z.enum(["approve", "reject", "request_reupload"]),
  remarks: z.string().optional(),
  userId: z.string().optional() // TODO: Get from session when auth is implemented
});

// GET - Fetch pending approvals
export async function GET(request: Request) {
  try {
    await ensureDbExists();

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';
    const ward = searchParams.get('ward');
    const fiscalYear = searchParams.get('fiscalYear');

    // Build where clause
    const whereClause: Record<string, unknown> = {
      status: status
    };

    // Add program filters if specified
    const programFilters: Record<string, unknown> = {};
    
    if (ward) {
      programFilters.wardId = ward;
    }
    
    if (fiscalYear) {
      programFilters.fiscalYearId = fiscalYear;
    }

    if (Object.keys(programFilters).length > 0) {
      whereClause.program = programFilters;
    }

    // Fetch approvals with related data
    const approvals = await prisma.programApproval.findMany({
      where: whereClause,
      include: {
        program: {
          include: {
            ward: true,
            fiscalYear: true,
            programType: true,
            fundingSource: true,
            documents: {
              where: {
                category: {
                  in: ["red_book", "executive_approval", "estimation", "monitoring"]
                }
              }
            }
          }
        },
        approvedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: [
        { createdAt: 'desc' }
      ]
    });

    // Transform the data for frontend consumption
    const transformedApprovals = approvals.map(approval => ({
      id: approval.id,
      programId: approval.program.id,
      programName: approval.program.name,
      programCode: approval.program.code,
      ward: `Ward ${approval.program.ward.code}`,
      wardName: approval.program.ward.name,
      submittedBy: getSubmittedByFromStep(approval.step),
      submittedDate: approval.createdAt.toISOString().split('T')[0],
      documentType: getDocumentTypeFromStep(approval.step),
      attachedFiles: approval.program.documents.map(doc => doc.fileName),
      remarks: approval.remarks || "",
      status: approval.status,
      priority: getPriorityFromStep(approval.step),
      step: approval.step,
      approvedBy: approval.approvedBy?.name,
      approvedAt: approval.approvedAt?.toISOString(),
      fiscalYear: approval.program.fiscalYear.year,
      programType: approval.program.programType.name,
      budget: approval.program.budget ? Number(approval.program.budget) : null
    }));

    return NextResponse.json({ 
      approvals: transformedApprovals,
      total: transformedApprovals.length
    });

  } catch (error) {
    console.error("Error fetching approvals:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Process approval action
export async function POST(request: Request) {
  try {
    await ensureDbExists();

    const body = await request.json();
    const validatedData = approvalActionSchema.parse(body);

    // Find the approval
    const approval = await prisma.programApproval.findUnique({
      where: { id: validatedData.approvalId },
      include: {
        program: true
      }
    });

    if (!approval) {
      return NextResponse.json(
        { error: "Approval not found" },
        { status: 404 }
      );
    }

    if (approval.status !== "pending") {
      return NextResponse.json(
        { error: "Approval has already been processed" },
        { status: 400 }
      );
    }

    // Update approval based on action
    let newStatus: string;
    let newProgramStatus: string | undefined;

    switch (validatedData.action) {
      case "approve":
        newStatus = "approved";
        // Move program to next status if this is the final approval step
        if (approval.step === "cao") {
          newProgramStatus = "APPROVED";
        }
        break;
      case "reject":
        newStatus = "rejected";
        // Keep program in current status or move to rejected state
        break;
      case "request_reupload":
        newStatus = "re-upload-requested";
        break;
      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }

    // Update approval
    const updatedApproval = await prisma.programApproval.update({
      where: { id: validatedData.approvalId },
      data: {
        status: newStatus,
        remarks: validatedData.remarks,
        approvedById: validatedData.userId, // TODO: Get from session
        approvedAt: new Date()
      }
    });

    // Update program status if needed
    if (newProgramStatus) {
      await prisma.program.update({
        where: { id: approval.programId },
        data: { status: newProgramStatus as ProgramStatus }
      });
    }

    // Create activity log
    await prisma.activityLog.create({
      data: {
        action: `approval_${validatedData.action}`,
        description: `${validatedData.action.replace('_', ' ')} approval for program ${approval.program.name}`,
        entityType: "approval",
        entityId: approval.id,
        userId: validatedData.userId,
        metadata: {
          programId: approval.programId,
          step: approval.step,
          remarks: validatedData.remarks
        }
      }
    });

    return NextResponse.json({ 
      success: true,
      approval: updatedApproval
    });

  } catch (error) {
    console.error("Error processing approval:", error);
    
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
function getSubmittedByFromStep(step: string): string {
  switch (step) {
    case "ward_secretary": return "Ward Secretary";
    case "planning_officer": return "Planning Officer";
    case "cao": return "CAO";
    case "technical_head": return "Technical Head";
    default: return "System";
  }
}

function getDocumentTypeFromStep(step: string): string {
  switch (step) {
    case "ward_secretary": return "Committee Minutes";
    case "planning_officer": return "Program Approval";
    case "cao": return "Executive Approval";
    case "technical_head": return "Cost Estimation";
    default: return "Document Review";
  }
}

function getPriorityFromStep(step: string): string {
  switch (step) {
    case "cao": return "high";
    case "planning_officer": return "medium";
    default: return "low";
  }
}

// PUT - Update approval status (approve/reject)
export async function PUT(request: Request) {
  try {
    await ensureDbExists();

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { approvalId, action, remarks } = body;

    if (!approvalId || !action) {
      return NextResponse.json(
        { error: "Approval ID and action are required" },
        { status: 400 }
      );
    }

    // Find the approval
    const approval = await prisma.programApproval.findUnique({
      where: { id: approvalId },
      include: {
        program: {
          include: {
            ward: true,
            fiscalYear: true
          }
        }
      }
    });

    if (!approval) {
      return NextResponse.json(
        { error: "Approval not found" },
        { status: 404 }
      );
    }

    if (approval.status !== "pending") {
      return NextResponse.json(
        { error: "This approval has already been processed" },
        { status: 400 }
      );
    }

    let newStatus: string;
    let programStatus: ProgramStatus | undefined;

    switch (action) {
      case "approve":
        newStatus = "approved";
        if (approval.step === "cao") {
          programStatus = ProgramStatus.APPROVED;
        }
        break;
      case "reject":
        newStatus = "rejected";
        if (approval.step === "cao") {
          programStatus = ProgramStatus.DRAFT; // Reset to draft for rejection
        }
        break;
      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }

    // Update approval
    const updatedApproval = await prisma.programApproval.update({
      where: { id: approvalId },
      data: {
        status: newStatus,
        remarks: remarks,
        approvedById: session.user.id,
        approvedAt: newStatus === "approved" ? new Date() : null
      },
      include: {
        program: true,
        approvedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Update program status if needed
    if (programStatus) {
      await prisma.program.update({
        where: { id: approval.programId },
        data: { status: programStatus }
      });
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: `approval_${action}d`,
        description: `Approval ${action}d for program: ${approval.program.name}`,
        entityType: "approval",
        entityId: approval.id,
        userId: session.user.id
      }
    });

    return NextResponse.json({
      message: `Approval ${action}d successfully`,
      approval: updatedApproval
    });

  } catch (error) {
    console.error("Error updating approval:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
