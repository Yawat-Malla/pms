import { NextResponse } from "next/server";
import { prisma, ensureDbExists } from "@/lib/prisma";

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
    const { name, code } = body;
    
    // Validation
    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: "Name is required and must be a string" },
        { status: 400 }
      );
    }
    
    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: "Code is required and must be a string" },
        { status: 400 }
      );
    }
    
    // Check if program type already exists
    const existingProgramType = await prisma.programType.findFirst({
      where: {
        OR: [
          { name },
          { code }
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
      data: {
        name,
        code
      }
    });
    
    return NextResponse.json({ programType }, { status: 201 });
    
  } catch (error) {
    console.error("Error creating program type:", error);
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
    const { id, name, code } = body;
    
    // Validation
    if (!id) {
      return NextResponse.json(
        { error: "Program type ID is required" },
        { status: 400 }
      );
    }
    
    // Check if program type exists
    const existingProgramType = await prisma.programType.findUnique({
      where: { id }
    });
    
    if (!existingProgramType) {
      return NextResponse.json(
        { error: "Program type not found" },
        { status: 404 }
      );
    }
    
    // Check if name or code already exists for another program type
    if (name || code) {
      const duplicateProgramType = await prisma.programType.findFirst({
        where: {
          OR: [
            name ? { name } : {},
            code ? { code } : {}
          ],
          id: { not: id }
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
      where: { id },
      data: {
        name: name || undefined,
        code: code || undefined
      }
    });
    
    return NextResponse.json({ programType: updatedProgramType });
    
  } catch (error) {
    console.error("Error updating program type:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a program type
export async function DELETE(request: Request) {
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
    
    // Check if program type exists
    const existingProgramType = await prisma.programType.findUnique({
      where: { id },
      include: { programs: { select: { id: true } } }
    });
    
    if (!existingProgramType) {
      return NextResponse.json(
        { error: "Program type not found" },
        { status: 404 }
      );
    }
    
    // Check if program type is in use
    if (existingProgramType.programs.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete program type that is in use by programs" },
        { status: 400 }
      );
    }
    
    // Delete the program type
    await prisma.programType.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error("Error deleting program type:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}