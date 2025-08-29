import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma, ensureDbExists } from "@/lib/prisma";
import { z } from "zod";

const bulkActionSchema = z.object({
  approvalIds: z.array(z.string()),
  action: z.enum(["approve", "reject"]),
  remarks: z.string().optional(),
});

export async function PUT(request: NextRequest) {
  try {
    await ensureDbExists();

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { approvalIds, action, remarks } = bulkActionSchema.parse(body);

    if (approvalIds.length === 0) {
      return NextResponse.json({ error: "No approvals selected" }, { status: 400 });
    }

    // Process bulk action in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const updatedApprovals = [];

      for (const approvalId of approvalIds) {
        // Get the approval
        const approval = await tx.programApproval.findUnique({
          where: { id: approvalId },
          include: { program: true }
        });

        if (!approval) {
          continue; // Skip if approval not found
        }

        // Update approval status
        const updatedApproval = await tx.programApproval.update({
          where: { id: approvalId },
          data: {
            status: action === 'approve' ? 'approved' : 'rejected',
            approvedById: session.user.id,
            approvedAt: new Date(),
            remarks: remarks || `Bulk ${action}d by ${session.user.name}`,
          }
        });

        // Update program status if approved
        if (action === 'approve') {
          await tx.program.update({
            where: { id: approval.program.id },
            data: {
              status: 'APPROVED'
            }
          });

          // Create activity log
          await tx.activityLog.create({
            data: {
              userId: session.user.id,
              action: 'APPROVE_PROGRAM',
              description: `Bulk approved program: ${approval.program.name}`,
              entityType: 'program',
              entityId: approval.program.id,
            }
          });
        } else {
          // Rejected - update program status
          await tx.program.update({
            where: { id: approval.program.id },
            data: {
              status: 'REJECTED'
            }
          });

          // Create activity log
          await tx.activityLog.create({
            data: {
              userId: session.user.id,
              action: 'REJECT_PROGRAM',
              description: `Bulk rejected program: ${approval.program.name}`,
              entityType: 'program',
              entityId: approval.program.id,
            }
          });
        }

        updatedApprovals.push(updatedApproval);
      }

      return updatedApprovals;
    });

    return NextResponse.json({
      message: `Successfully ${action}d ${result.length} approvals`,
      processedCount: result.length,
      totalRequested: approvalIds.length
    });

  } catch (error) {
    console.error("Error processing bulk action:", error);
    return NextResponse.json(
      { error: "Failed to process bulk action" },
      { status: 500 }
    );
  }
}
