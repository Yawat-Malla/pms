import { NextRequest, NextResponse } from "next/server";
import { prisma, ensureDbExists } from "@/lib/prisma";
import { z } from "zod";

const createWardSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required")
});

const updateWardSchema = z.object({
  id: z.string().min(1, "ID is required"),
  name: z.string().optional(),
  code: z.string().optional()
});

// GET all wards
export async function GET() {
  try {
    // Ensure database exists before querying
    await ensureDbExists();
    
    const wards = await prisma.ward.findMany({
      orderBy: {
        code: "asc"
      }
    });
    
    return NextResponse.json({ wards });
    
  } catch (error) {
    console.error("Error fetching wards:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create a new ward
export async function POST(request: Request) {
  try {
    await ensureDbExists();

    const body = await request.json();
    const validatedData = createWardSchema.parse(body);

    // Check if ward already exists
    const existingWard = await prisma.ward.findFirst({
      where: {
        OR: [
          { name: validatedData.name },
          { code: validatedData.code }
        ]
      }
    });

    if (existingWard) {
      return NextResponse.json(
        { error: "Ward with this name or code already exists" },
        { status: 400 }
      );
    }

    // Create the ward
    const ward = await prisma.ward.create({
      data: validatedData
    });

    return NextResponse.json({ ward }, { status: 201 });

  } catch (error) {
    console.error("Error creating ward:", error);

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

// PUT - Update a ward
export async function PUT(request: Request) {
  try {
    await ensureDbExists();

    const body = await request.json();
    const validatedData = updateWardSchema.parse(body);

    // Check if ward exists
    const existingWard = await prisma.ward.findUnique({
      where: { id: validatedData.id }
    });

    if (!existingWard) {
      return NextResponse.json(
        { error: "Ward not found" },
        { status: 404 }
      );
    }

    // Check for duplicates if name or code is being updated
    if (validatedData.name || validatedData.code) {
      const duplicateWard = await prisma.ward.findFirst({
        where: {
          OR: [
            validatedData.name ? { name: validatedData.name } : {},
            validatedData.code ? { code: validatedData.code } : {}
          ],
          id: { not: validatedData.id }
        }
      });

      if (duplicateWard) {
        return NextResponse.json(
          { error: "Another ward with this name or code already exists" },
          { status: 400 }
        );
      }
    }

    // Update the ward
    const updatedWard = await prisma.ward.update({
      where: { id: validatedData.id },
      data: {
        name: validatedData.name,
        code: validatedData.code
      }
    });

    return NextResponse.json({ ward: updatedWard });

  } catch (error) {
    console.error("Error updating ward:", error);

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

// DELETE - Delete a ward
export async function DELETE(request: NextRequest) {
  try {
    await ensureDbExists();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: "Ward ID is required" },
        { status: 400 }
      );
    }

    // Check if ward exists and has associated data
    const existingWard = await prisma.ward.findUnique({
      where: { id },
      include: {
        users: true,
        programs: true
      }
    });

    if (!existingWard) {
      return NextResponse.json(
        { error: "Ward not found" },
        { status: 404 }
      );
    }

    // Check if ward has associated users or programs
    if (existingWard.users.length > 0 || existingWard.programs.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete ward with associated users or programs" },
        { status: 400 }
      );
    }

    // Delete the ward
    await prisma.ward.delete({
      where: { id }
    });

    return NextResponse.json({ message: "Ward deleted successfully" });

  } catch (error) {
    console.error("Error deleting ward:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}