import { NextResponse } from "next/server";
import { prisma, ensureDbExists } from "@/lib/prisma";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    // Ensure database exists before querying
    await ensureDbExists();
    
    const programId = params.id;
    
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
        createdBy: true,
        fiscalYear: true,
        programType: true,
        fundingSource: true,
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