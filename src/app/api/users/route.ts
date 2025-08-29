import { NextRequest, NextResponse } from "next/server";
import { prisma, ensureDbExists } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcrypt";
import { z } from "zod";

const createUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  wardId: z.string().optional(),
  roleIds: z.array(z.string()).default([])
});

const updateUserSchema = z.object({
  id: z.string().min(1, "ID is required"),
  name: z.string().optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  wardId: z.string().optional(),
  roleIds: z.array(z.string()).optional()
});

// GET all users
export async function GET(request: NextRequest) {
  try {
    await ensureDbExists();

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const wardId = searchParams.get('wardId');
    const roleId = searchParams.get('roleId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Build where clause
    const whereClause: Record<string, unknown> = {};

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (wardId) {
      whereClause.wardId = wardId;
    }

    if (roleId) {
      whereClause.roles = {
        some: { id: roleId }
      };
    }

    const skip = (page - 1) * limit;

    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        include: {
          ward: true,
          roles: true,
          _count: {
            select: {
              programsCreated: true,
              documentsUploaded: true,
              paymentsRequested: true,
              paymentsApproved: true,
              approvalsGiven: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.user.count({ where: whereClause })
    ]);

    // Remove password hashes from response
    const usersWithoutPasswords = users.map(({ hashedPassword, ...user }) => user);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      users: usersWithoutPasswords,
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
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create a new user
export async function POST(request: Request) {
  try {
    await ensureDbExists();

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createUserSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        hashedPassword,
        wardId: validatedData.wardId || null,
        roles: {
          connect: validatedData.roleIds.map(id => ({ id }))
        }
      },
      include: {
        roles: true,
        ward: true
      }
    });

    // Remove password from response
    const { hashedPassword: _, ...userWithoutPassword } = user;

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "user_created",
        description: `User created: ${user.name} (${user.email})`,
        entityType: "user",
        entityId: user.id,
        userId: session.user.id
      }
    });

    return NextResponse.json(
      { 
        message: "User created successfully", 
        user: userWithoutPassword 
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("Error creating user:", error);
    
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

// PUT - Update a user
export async function PUT(request: Request) {
  try {
    await ensureDbExists();

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateUserSchema.parse(body);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: validatedData.id }
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check for email conflicts if email is being updated
    if (validatedData.email && validatedData.email !== existingUser.email) {
      const emailConflict = await prisma.user.findUnique({
        where: { email: validatedData.email }
      });

      if (emailConflict) {
        return NextResponse.json(
          { error: "Email already in use by another user" },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {};

    if (validatedData.name) updateData.name = validatedData.name;
    if (validatedData.email) updateData.email = validatedData.email;
    if (validatedData.wardId !== undefined) updateData.wardId = validatedData.wardId;

    // Hash new password if provided
    if (validatedData.password) {
      updateData.hashedPassword = await bcrypt.hash(validatedData.password, 12);
    }

    // Handle role updates
    if (validatedData.roleIds) {
      updateData.roles = {
        set: validatedData.roleIds.map(id => ({ id }))
      };
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: validatedData.id },
      data: updateData,
      include: {
        roles: true,
        ward: true
      }
    });

    // Remove password from response
    const { hashedPassword: _, ...userWithoutPassword } = updatedUser;

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "user_updated",
        description: `User updated: ${updatedUser.name} (${updatedUser.email})`,
        entityType: "user",
        entityId: updatedUser.id,
        userId: session.user.id
      }
    });

    return NextResponse.json({ user: userWithoutPassword });

  } catch (error) {
    console.error("Error updating user:", error);

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

// DELETE - Delete a user
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
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Prevent self-deletion
    if (id === session.user.id) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
      include: {
        programsCreated: true,
        documentsUploaded: true,
        paymentsRequested: true,
        paymentsApproved: true,
        approvalsGiven: true
      }
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if user has associated data
    const hasAssociatedData =
      existingUser.programsCreated.length > 0 ||
      existingUser.documentsUploaded.length > 0 ||
      existingUser.paymentsRequested.length > 0 ||
      existingUser.paymentsApproved.length > 0 ||
      existingUser.approvalsGiven.length > 0;

    if (hasAssociatedData) {
      return NextResponse.json(
        { error: "Cannot delete user with associated data. Consider deactivating instead." },
        { status: 400 }
      );
    }

    // Delete the user
    await prisma.user.delete({
      where: { id }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "user_deleted",
        description: `User deleted: ${existingUser.name} (${existingUser.email})`,
        entityType: "user",
        entityId: id,
        userId: session.user.id
      }
    });

    return NextResponse.json({ message: "User deleted successfully" });

  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
