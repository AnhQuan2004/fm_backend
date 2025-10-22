import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/jwt";

const profileInputSchema = z.object({
  email: z.string().email(),
  username: z.string().trim().optional(),
  firstName: z.string().trim().optional(),
  lastName: z.string().trim().optional(),
  location: z.string().trim().optional(),
  skills: z.array(z.string()).optional(),
  socials: z.string().trim().optional(),
  github: z.string().trim().optional(),
  displayName: z
    .string()
    .trim()
    .min(2, "Display name phải có ít nhất 2 ký tự")
    .max(80, "Display name tối đa 80 ký tự")
    .optional(),
  bio: z
    .string()
    .trim()
    .min(3, "Bio phải có ít nhất 3 ký tự")
    .max(240, "Bio tối đa 240 ký tự")
    .optional(),
});

const emailQuerySchema = z.object({
  email: z.string().email().optional(),
});

async function resolveEmail(req: NextRequest): Promise<string | null> {
  const parsedQuery = emailQuerySchema.safeParse({
    email: req.nextUrl.searchParams.get("email") ?? undefined,
  });

  if (parsedQuery.success && parsedQuery.data.email) {
    return parsedQuery.data.email;
  }

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session");
  if (!sessionCookie) {
    return null;
  }

  const session = verifySession(sessionCookie.value);
  return session?.email ?? null;
}

export async function GET(req: NextRequest) {
  try {
    const email = await resolveEmail(req);
    if (!email) {
      return NextResponse.json({ ok: false, error: "Missing email" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        location: true,
        skills: true,
        socials: true,
        github: true,
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
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        location: user.location,
        skills: user.skills,
        socials: user.socials,
        github: user.github,
        displayName: user.displayName,
        bio: user.bio,
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

    const { email, username, ...rest } = parsed.data;

    if (username) {
      const existingUser = await prisma.user.findUnique({
        where: { username },
      });
      if (existingUser && existingUser.email !== email) {
        return NextResponse.json({ ok: false, error: "Username already taken" }, { status: 409 });
      }
    }

    const profile = await prisma.user.upsert({
      where: { email },
      create: {
        email,
        username,
        ...rest,
      },
      update: {
        username,
        ...rest,
      },
      select: {
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        location: true,
        skills: true,
        socials: true,
        github: true,
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
