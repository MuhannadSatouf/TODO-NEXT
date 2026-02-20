import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const getUserId = (request: Request) => request.headers.get("x-user-id");

export async function GET(request: Request) {
  const userId = getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const todos = await prisma.todo.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(todos);
}

export async function POST(request: Request) {
  const userId = getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const notes = typeof body.notes === "string" ? body.notes.trim() : null;
    const flagged = Boolean(body.flagged);

    if (!title) {
      return NextResponse.json(
        { error: "Title is required." },
        { status: 400 }
      );
    }

    const todo = await prisma.todo.create({
      data: {
        title,
        notes,
        flagged,
        userId,
      },
    });

    return NextResponse.json(todo, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Unable to create todo." },
      { status: 500 }
    );
  }
}
