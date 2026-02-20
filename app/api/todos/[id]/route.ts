import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const getUserId = (request: Request) => request.headers.get("x-user-id");

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const data: {
      title?: string;
      notes?: string | null;
      completed?: boolean;
      flagged?: boolean;
    } = {};

    if (typeof body.title === "string") {
      const title = body.title.trim();
      if (!title) {
        return NextResponse.json(
          { error: "Title cannot be empty." },
          { status: 400 }
        );
      }
      data.title = title;
    }

    if (typeof body.notes === "string") {
      data.notes = body.notes.trim();
    }

    if (body.notes === null) {
      data.notes = null;
    }

    if (typeof body.completed === "boolean") {
      data.completed = body.completed;
    }

    if (typeof body.flagged === "boolean") {
      data.flagged = body.flagged;
    }

    const result = await prisma.todo.updateMany({
      where: { id, userId },
      data,
    });

    if (!result.count) {
      return NextResponse.json({ error: "Todo not found." }, { status: 404 });
    }

    const todo = await prisma.todo.findFirst({ where: { id, userId } });
    return NextResponse.json(todo);
  } catch {
    return NextResponse.json(
      { error: "Unable to update todo." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;

  try {
    const result = await prisma.todo.deleteMany({ where: { id, userId } });
    if (!result.count) {
      return NextResponse.json({ error: "Todo not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Unable to delete todo." },
      { status: 500 }
    );
  }
}
