import { NextResponse } from "next/server";
import { prisma, ensureDbExists } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Ensure database exists before querying
    await ensureDbExists();

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: programId } = await params;
    
    if (!programId) {
      return NextResponse.json(
        { error: "Program ID is required" },
        { status: 400 }
      );
    }
    
    const program = await prisma.program.findUnique({
      where: { id: programId },
      include: {
        ward: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        fiscalYear: true,
        programType: true,
        fundingSource: true,
        documents: {
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        approvals: {
          include: {
            approver: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        payments: {
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
          orderBy: { createdAt: 'desc' }
        },
        monitoring: {
          include: {
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: {
            documents: true,
            approvals: true,
            payments: true,
            monitoring: true
          }
        }
      },
    });
    
    if (!program) {
      return NextResponse.json(
        { error: "Program not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ program });
    
  } catch (error) {
    console.error("Error fetching program:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}