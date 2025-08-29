import { NextRequest, NextResponse } from "next/server";
import { prisma, ensureDbExists } from "@/lib/prisma";
import { z } from "zod";

const createProgramTypeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required")
});

const updateProgramTypeSchema = z.object({
  id: z.string().min(1, "ID is required"),
  name: z.string().optional(),
  code: z.string().optional()
});

// GET all program types
export async function GET() {
  try {
    // Ensure database exists before querying
    await ensureDbExists();
    
    const programTypes = await prisma.programType.findMany({
      orderBy: {
        name: "asc"
      }
    });
    
    return NextResponse.json({ programTypes });
    
  } catch (error) {
    console.error("Error fetching program types:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create a new program type
export async function POST(request: Request) {
  try {
    await ensureDbExists();

    const body = await request.json();
    const validatedData = createProgramTypeSchema.parse(body);

    // Check if program type already exists
    const existingProgramType = await prisma.programType.findFirst({
      where: {
        OR: [
          { name: validatedData.name },
          { code: validatedData.code }
        ]
      }
    });

    if (existingProgramType) {
      return NextResponse.json(
        { error: "Program type with this name or code already exists" },
        { status: 400 }
      );
    }
    
    // Create the program type
    const programType = await prisma.programType.create({
      data: validatedData
    });

    return NextResponse.json({ programType }, { status: 201 });

  } catch (error) {
    console.error("Error creating program type:", error);

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

// PUT - Update a program type
export async function PUT(request: Request) {
  try {
    await ensureDbExists();

    const body = await request.json();
    const validatedData = updateProgramTypeSchema.parse(body);

    // Check if program type exists
    const existingProgramType = await prisma.programType.findUnique({
      where: { id: validatedData.id }
    });

    if (!existingProgramType) {
      return NextResponse.json(
        { error: "Program type not found" },
        { status: 404 }
      );
    }

    // Check for duplicates if name or code is being updated
    if (validatedData.name || validatedData.code) {
      const duplicateProgramType = await prisma.programType.findFirst({
        where: {
          OR: [
            validatedData.name ? { name: validatedData.name } : {},
            validatedData.code ? { code: validatedData.code } : {}
          ],
          id: { not: validatedData.id }
        }
      });

      if (duplicateProgramType) {
        return NextResponse.json(
          { error: "Another program type with this name or code already exists" },
          { status: 400 }
        );
      }
    }

    // Update the program type
    const updatedProgramType = await prisma.programType.update({
      where: { id: validatedData.id },
      data: {
        name: validatedData.name,
        code: validatedData.code
      }
    });

    return NextResponse.json({ programType: updatedProgramType });

  } catch (error) {
    console.error("Error updating program type:", error);

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

// DELETE - Delete a program type
export async function DELETE(request: NextRequest) {
  try {
    await ensureDbExists();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: "Program type ID is required" },
        { status: 400 }
      );
    }

    // Check if program type exists and has associated programs
    const existingProgramType = await prisma.programType.findUnique({
      where: { id },
      include: {
        programs: true
      }
    });

    if (!existingProgramType) {
      return NextResponse.json(
        { error: "Program type not found" },
        { status: 404 }
      );
    }

    // Check if program type has associated programs
    if (existingProgramType.programs.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete program type with associated programs" },
        { status: 400 }
      );
    }

    // Delete the program type
    await prisma.programType.delete({
      where: { id }
    });

    return NextResponse.json({ message: "Program type deleted successfully" });

  } catch (error) {
    console.error("Error deleting program type:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}