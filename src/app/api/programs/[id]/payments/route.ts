import { NextRequest, NextResponse } from "next/server";
import { prisma, ensureDbExists } from "@/lib/prisma";
import { z } from "zod";

// Validation schema for payment request
const createPaymentSchema = z.object({
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  purpose: z.string().min(1, "Purpose is required"),
  requestedById: z.string().optional() // TODO: Get from session when auth is implemented
});

// Validation schema for payment approval
const approvePaymentSchema = z.object({
  paymentId: z.string().min(1, "Payment ID is required"),
  action: z.enum(["approve", "reject"]),
  remarks: z.string().optional(),
  approvedById: z.string().optional() // TODO: Get from session
});

// GET - Fetch payments for a program
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDbExists();

    const { id: programId } = await params;
    const { searchParams } = new URL(request.url);
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
    if (status) {
      whereClause.status = status;
    }

    // Fetch payments
    const payments = await prisma.programPayment.findMany({
      where: whereClause,
      include: {
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
      }
    });

    // Transform for frontend
    const transformedPayments = payments.map(payment => ({
      id: payment.id,
      amount: Number(payment.amount),
      formattedAmount: `Rs. ${Number(payment.amount).toLocaleString()}`,
      purpose: payment.purpose,
      status: payment.status,
      statusLabel: getStatusLabel(payment.status),
      requestedBy: payment.requestedBy?.name || "System",
      requestedAt: payment.createdAt.toISOString(),
      approvedBy: payment.approvedBy?.name,
      approvedAt: payment.approvedAt?.toISOString(),
      timeAgo: getTimeAgo(payment.createdAt)
    }));

    // Calculate summary statistics
    const summary = {
      total: transformedPayments.length,
      pending: transformedPayments.filter(p => p.status === 'pending').length,
      approved: transformedPayments.filter(p => p.status === 'approved').length,
      rejected: transformedPayments.filter(p => p.status === 'rejected').length,
      totalAmount: transformedPayments.reduce((sum, p) => sum + p.amount, 0),
      approvedAmount: transformedPayments
        .filter(p => p.status === 'approved')
        .reduce((sum, p) => sum + p.amount, 0)
    };

    return NextResponse.json({ 
      payments: transformedPayments,
      summary,
      programId: programId
    });

  } catch (error) {
    console.error("Error fetching program payments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create a new payment request
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDbExists();

    const { id: programId } = await params;
    const body = await request.json();
    
    // Validate input
    const validatedData = createPaymentSchema.parse(body);

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

    // Check if program is in a state that allows payment requests
    if (!["APPROVED", "CONTRACTED", "MONITORING", "PAYMENT_RUNNING"].includes(program.status)) {
      return NextResponse.json(
        { error: "Program must be approved before payment requests can be made" },
        { status: 400 }
      );
    }

    // Create payment request
    const payment = await prisma.programPayment.create({
      data: {
        programId: programId,
        amount: validatedData.amount,
        purpose: validatedData.purpose,
        status: "pending",
        requestedById: validatedData.requestedById || "system" // TODO: Get from session
      },
      include: {
        requestedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Create activity log
    await prisma.activityLog.create({
      data: {
        action: "payment_requested",
        description: `Payment request of Rs. ${validatedData.amount.toLocaleString()} created for program ${program.name}`,
        entityType: "payment",
        entityId: payment.id,
        userId: validatedData.requestedById,
        metadata: {
          programId: programId,
          amount: validatedData.amount,
          purpose: validatedData.purpose
        }
      }
    });

    // Create notification for approvers
    await prisma.notification.create({
      data: {
        title: "New Payment Request",
        message: `Payment request of Rs. ${validatedData.amount.toLocaleString()} for "${validatedData.purpose}" requires approval.`,
        type: "payment",
        priority: "medium",
        entityType: "payment",
        entityId: payment.id
      }
    });

    return NextResponse.json(
      { 
        message: "Payment request created successfully",
        payment: {
          id: payment.id,
          amount: Number(payment.amount),
          formattedAmount: `Rs. ${Number(payment.amount).toLocaleString()}`,
          purpose: payment.purpose,
          status: payment.status,
          statusLabel: getStatusLabel(payment.status),
          requestedBy: payment.requestedBy?.name || "System",
          requestedAt: payment.createdAt.toISOString(),
          timeAgo: getTimeAgo(payment.createdAt)
        }
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("Error creating payment request:", error);
    
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

// PUT - Approve or reject a payment
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDbExists();

    const { id: programId } = await params;
    const body = await request.json();
    
    // Validate input
    const validatedData = approvePaymentSchema.parse(body);

    // Find the payment
    const payment = await prisma.programPayment.findFirst({
      where: {
        id: validatedData.paymentId,
        programId: programId
      },
      include: {
        program: true
      }
    });

    if (!payment) {
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 }
      );
    }

    if (payment.status !== "pending") {
      return NextResponse.json(
        { error: "Payment has already been processed" },
        { status: 400 }
      );
    }

    // Update payment
    const updatedPayment = await prisma.programPayment.update({
      where: { id: validatedData.paymentId },
      data: {
        status: validatedData.action === "approve" ? "approved" : "rejected",
        approvedById: validatedData.approvedById,
        approvedAt: new Date()
      },
      include: {
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

    // Create activity log
    await prisma.activityLog.create({
      data: {
        action: `payment_${validatedData.action}d`,
        description: `Payment request of Rs. ${Number(payment.amount).toLocaleString()} ${validatedData.action}d for program ${payment.program.name}`,
        entityType: "payment",
        entityId: payment.id,
        userId: validatedData.approvedById,
        metadata: {
          programId: programId,
          amount: Number(payment.amount),
          purpose: payment.purpose,
          remarks: validatedData.remarks
        }
      }
    });

    return NextResponse.json({ 
      success: true,
      payment: {
        id: updatedPayment.id,
        amount: Number(updatedPayment.amount),
        formattedAmount: `Rs. ${Number(updatedPayment.amount).toLocaleString()}`,
        purpose: updatedPayment.purpose,
        status: updatedPayment.status,
        statusLabel: getStatusLabel(updatedPayment.status),
        requestedBy: updatedPayment.requestedBy?.name || "System",
        requestedAt: updatedPayment.createdAt.toISOString(),
        approvedBy: updatedPayment.approvedBy?.name,
        approvedAt: updatedPayment.approvedAt?.toISOString(),
        timeAgo: getTimeAgo(updatedPayment.createdAt)
      }
    });

  } catch (error) {
    console.error("Error processing payment:", error);
    
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
function getStatusLabel(status: string): string {
  switch (status) {
    case "pending": return "Pending";
    case "approved": return "Approved";
    case "rejected": return "Rejected";
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
