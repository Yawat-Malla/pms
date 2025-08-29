import { NextRequest, NextResponse } from "next/server";
import { prisma, ensureDbExists } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const createRoleSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional()
});

const updateRoleSchema = z.object({
  id: z.string().min(1, "ID is required"),
  name: z.string().optional(),
  description: z.string().optional()
});

// GET all roles
export async function GET() {
  try {
    await ensureDbExists();

    const roles = await prisma.role.findMany({
      include: {
        _count: {
          select: {
            users: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({ roles });

  } catch (error) {
    console.error("Error fetching roles:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create a new role
export async function POST(request: Request) {
  try {
    await ensureDbExists();

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createRoleSchema.parse(body);

    // Check if role already exists
    const existingRole = await prisma.role.findUnique({
      where: { name: validatedData.name }
    });

    if (existingRole) {
      return NextResponse.json(
        { error: "Role with this name already exists" },
        { status: 400 }
      );
    }

    // Create the role
    const role = await prisma.role.create({
      data: validatedData
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "role_created",
        description: `Role created: ${role.name}`,
        entityType: "role",
        entityId: role.id,
        userId: session.user.id
      }
    });

    return NextResponse.json({ role }, { status: 201 });

  } catch (error) {
    console.error("Error creating role:", error);
    
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

// PUT - Update a role
export async function PUT(request: Request) {
  try {
    await ensureDbExists();

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateRoleSchema.parse(body);

    // Check if role exists
    const existingRole = await prisma.role.findUnique({
      where: { id: validatedData.id }
    });

    if (!existingRole) {
      return NextResponse.json(
        { error: "Role not found" },
        { status: 404 }
      );
    }

    // Check for name conflicts if name is being updated
    if (validatedData.name && validatedData.name !== existingRole.name) {
      const nameConflict = await prisma.role.findUnique({
        where: { name: validatedData.name }
      });

      if (nameConflict) {
        return NextResponse.json(
          { error: "Another role with this name already exists" },
          { status: 400 }
        );
      }
    }

    // Update the role
    const updatedRole = await prisma.role.update({
      where: { id: validatedData.id },
      data: {
        name: validatedData.name,
        description: validatedData.description
      }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "role_updated",
        description: `Role updated: ${updatedRole.name}`,
        entityType: "role",
        entityId: updatedRole.id,
        userId: session.user.id
      }
    });

    return NextResponse.json({ role: updatedRole });

  } catch (error) {
    console.error("Error updating role:", error);
    
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

// DELETE - Delete a role
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
        { error: "Role ID is required" },
        { status: 400 }
      );
    }

    // Check if role exists and has associated users
    const existingRole = await prisma.role.findUnique({
      where: { id },
      include: {
        users: true
      }
    });

    if (!existingRole) {
      return NextResponse.json(
        { error: "Role not found" },
        { status: 404 }
      );
    }

    // Check if role has associated users
    if (existingRole.users.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete role with associated users" },
        { status: 400 }
      );
    }

    // Delete the role
    await prisma.role.delete({
      where: { id }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "role_deleted",
        description: `Role deleted: ${existingRole.name}`,
        entityType: "role",
        entityId: id,
        userId: session.user.id
      }
    });

    return NextResponse.json({ message: "Role deleted successfully" });

  } catch (error) {
    console.error("Error deleting role:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
