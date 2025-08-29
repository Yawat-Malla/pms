import { NextRequest, NextResponse } from "next/server";
import { prisma, ensureDbExists } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const createPaymentSchema = z.object({
  programId: z.string().min(1, "Program ID is required"),
  amount: z.number().positive("Amount must be positive"),
  description: z.string().min(1, "Description is required"),
  category: z.string().min(1, "Category is required"),
  dueDate: z.string().optional(),
  supportingDocuments: z.array(z.string()).default([])
});

const updatePaymentSchema = z.object({
  id: z.string().min(1, "Payment ID is required"),
  status: z.enum(["pending", "approved", "rejected", "paid"]).optional(),
  amount: z.number().positive().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  dueDate: z.string().optional(),
  approverNotes: z.string().optional()
});

// GET payments
export async function GET(request: NextRequest) {
  try {
    await ensureDbExists();

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const programId = searchParams.get('programId');
    const category = searchParams.get('category');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Build where clause
    const whereClause: Record<string, unknown> = {};

    if (status) {
      whereClause.status = status;
    }

    if (programId) {
      whereClause.programId = programId;
    }

    if (category) {
      whereClause.category = category;
    }

    // Filter by user's ward if they have one
    if (session.user.wardId) {
      whereClause.program = {
        wardId: session.user.wardId
      };
    }

    const skip = (page - 1) * limit;

    const [payments, totalCount] = await Promise.all([
      prisma.payment.findMany({
        where: whereClause,
        include: {
          program: {
            include: {
              ward: true,
              fiscalYear: true
            }
          },
          requestedBy: {
            select: {
              id: true,
              name: true,
              email: true
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
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.payment.count({ where: whereClause })
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      payments,
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
    console.error("Error fetching payments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create a new payment request
export async function POST(request: Request) {
  try {
    await ensureDbExists();

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createPaymentSchema.parse(body);

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

    // Check if user has permission to request payment for this program
    if (program.createdById !== session.user.id && session.user.wardId !== program.wardId) {
      return NextResponse.json(
        { error: "You don't have permission to request payment for this program" },
        { status: 403 }
      );
    }

    // Parse due date if provided
    let dueDate = null;
    if (validatedData.dueDate) {
      dueDate = new Date(validatedData.dueDate);
      if (isNaN(dueDate.getTime())) {
        return NextResponse.json(
          { error: "Invalid due date" },
          { status: 400 }
        );
      }
    }

    // Create the payment request
    const payment = await prisma.payment.create({
      data: {
        programId: validatedData.programId,
        amount: validatedData.amount,
        description: validatedData.description,
        category: validatedData.category,
        dueDate,
        status: "pending",
        requestedById: session.user.id,
        supportingDocuments: validatedData.supportingDocuments
      },
      include: {
        program: {
          include: {
            ward: true,
            fiscalYear: true
          }
        },
        requestedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Update program spent budget
    await prisma.program.update({
      where: { id: validatedData.programId },
      data: {
        spentBudget: {
          increment: validatedData.amount
        }
      }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "payment_requested",
        description: `Payment requested for program: ${program.name} - ${validatedData.description} (₦${validatedData.amount.toLocaleString()})`,
        entityType: "payment",
        entityId: payment.id,
        userId: session.user.id
      }
    });

    return NextResponse.json({ payment }, { status: 201 });

  } catch (error) {
    console.error("Error creating payment:", error);
    
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

// PUT - Update payment status or details
export async function PUT(request: Request) {
  try {
    await ensureDbExists();

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updatePaymentSchema.parse(body);

    // Check if payment exists
    const existingPayment = await prisma.payment.findUnique({
      where: { id: validatedData.id },
      include: {
        program: true
      }
    });

    if (!existingPayment) {
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 }
      );
    }

    // Check permissions
    if (existingPayment.requestedById !== session.user.id) {
      // TODO: Add proper role-based access control for approvers
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {};

    if (validatedData.status) updateData.status = validatedData.status;
    if (validatedData.amount !== undefined) updateData.amount = validatedData.amount;
    if (validatedData.description) updateData.description = validatedData.description;
    if (validatedData.category) updateData.category = validatedData.category;
    if (validatedData.approverNotes !== undefined) updateData.approverNotes = validatedData.approverNotes;

    // Handle due date
    if (validatedData.dueDate !== undefined) {
      if (validatedData.dueDate) {
        const dueDate = new Date(validatedData.dueDate);
        if (isNaN(dueDate.getTime())) {
          return NextResponse.json(
            { error: "Invalid due date" },
            { status: 400 }
          );
        }
        updateData.dueDate = dueDate;
      } else {
        updateData.dueDate = null;
      }
    }

    // If approving or rejecting, set approver
    if (validatedData.status && ["approved", "rejected"].includes(validatedData.status)) {
      updateData.approvedById = session.user.id;
      updateData.approvedAt = new Date();
    }

    // Update the payment
    const updatedPayment = await prisma.payment.update({
      where: { id: validatedData.id },
      data: updateData,
      include: {
        program: {
          include: {
            ward: true,
            fiscalYear: true
          }
        },
        requestedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        approvedBy: {
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
        action: "payment_updated",
        description: `Payment updated: ${updatedPayment.description} - Status: ${updatedPayment.status}`,
        entityType: "payment",
        entityId: updatedPayment.id,
        userId: session.user.id
      }
    });

    return NextResponse.json({
      message: "Payment updated successfully",
      payment: updatedPayment
    });

  } catch (error) {
    console.error("Error updating payment:", error);

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

// DELETE - Delete a payment request
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
        { error: "Payment ID is required" },
        { status: 400 }
      );
    }

    // Check if payment exists
    const existingPayment = await prisma.payment.findUnique({
      where: { id },
      include: {
        program: true
      }
    });

    if (!existingPayment) {
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 }
      );
    }

    // Check permissions - only creator can delete pending payments
    if (existingPayment.requestedById !== session.user.id) {
      return NextResponse.json(
        { error: "You don't have permission to delete this payment" },
        { status: 403 }
      );
    }

    // Only allow deletion of pending payments
    if (existingPayment.status !== "pending") {
      return NextResponse.json(
        { error: "Only pending payments can be deleted" },
        { status: 400 }
      );
    }

    // Revert program spent budget
    await prisma.program.update({
      where: { id: existingPayment.programId },
      data: {
        spentBudget: {
          decrement: existingPayment.amount
        }
      }
    });

    // Delete the payment
    await prisma.payment.delete({
      where: { id }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "payment_deleted",
        description: `Payment deleted: ${existingPayment.description} (₦${existingPayment.amount.toLocaleString()})`,
        entityType: "payment",
        entityId: id,
        userId: session.user.id
      }
    });

    return NextResponse.json({ message: "Payment deleted successfully" });

  } catch (error) {
    console.error("Error deleting payment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
