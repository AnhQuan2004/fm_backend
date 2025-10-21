import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/jwt";

const profileInputSchema = z.object({
  email: z.string().email(),
  displayName: z
    .string()
    .trim()
    .min(2, "Display name phải có ít nhất 2 ký tự")
    .max(80, "Display name tối đa 80 ký tự"),
  bio: z
    .string()
    .trim()
    .min(3, "Bio phải có ít nhất 3 ký tự")
    .max(240, "Bio tối đa 240 ký tự"),
});

const emailQuerySchema = z.object({
  email: z.string().email().optional(),
});

function resolveEmail(req: NextRequest): string | null {
  const parsedQuery = emailQuerySchema.safeParse({
    email: req.nextUrl.searchParams.get("email") ?? undefined,
  });

  if (parsedQuery.success && parsedQuery.data.email) {
    return parsedQuery.data.email;
  }

  const sessionCookie = cookies().get("session");
  if (!sessionCookie) {
    return null;
  }

  const session = verifySession(sessionCookie.value);
  return session?.email ?? null;
}

export async function GET(req: NextRequest) {
  try {
    const email = resolveEmail(req);
    if (!email) {
      return NextResponse.json({ ok: false, error: "Missing email" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        email: true,
        displayName: true,
        bio: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      profile: {
        email: user.email,
        displayName: user.displayName ?? "",
        bio: user.bio ?? "",
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: "Failed to fetch profile" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = profileInputSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { email, displayName, bio } = parsed.data;

    const profile = await prisma.user.upsert({
      where: { email },
      create: {
        email,
        displayName,
        bio,
      },
      update: {
        displayName,
        bio,
      },
      select: {
        email: true,
        displayName: true,
        bio: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ ok: true, profile });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: "Failed to save profile" }, { status: 500 });
  }
}
