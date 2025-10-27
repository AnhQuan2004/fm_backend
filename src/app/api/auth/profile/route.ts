import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";
import { z } from "zod";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/jwt";

const profileInputSchema = z.object({
  email: z.string().email(),
<<<<<<< HEAD
  username: z.string().trim().optional(),
  firstName: z.string().trim().optional(),
  lastName: z.string().trim().optional(),
  location: z.string().trim().optional(),
  skills: z.array(z.string()).optional(),
  socials: z.string().trim().optional(),
  github: z.string().trim().optional(),
=======
  username: z
    .string()
    .trim()
    .min(3, "Username phải có ít nhất 3 ký tự")
    .max(50, "Username tối đa 50 ký tự")
    .regex(/^[a-zA-Z0-9._-]+$/, "Username chỉ được chứa chữ, số và ._-")
    .optional(),
  firstName: z
    .string()
    .trim()
    .max(60, "First name tối đa 60 ký tự")
    .optional(),
  lastName: z
    .string()
    .trim()
    .max(60, "Last name tối đa 60 ký tự")
    .optional(),
  location: z
    .string()
    .trim()
    .max(120, "Location tối đa 120 ký tự")
    .optional(),
  skills: z
    .array(z.string().trim().min(1, "Kỹ năng không được để trống").max(40, "Tên kỹ năng quá dài"))
    .max(25, "Tối đa 25 kỹ năng")
    .optional(),
  socials: z
    .string()
    .trim()
    .max(200, "Link socials tối đa 200 ký tự")
    .optional(),
  github: z
    .string()
    .trim()
    .max(100, "GitHub username tối đa 100 ký tự")
    .optional(),
>>>>>>> e38804f (Change backend to Supabase)
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
<<<<<<< HEAD
    .max(240, "Bio tối đa 240 ký tự")
=======
    .max(280, "Bio tối đa 280 ký tự")
>>>>>>> e38804f (Change backend to Supabase)
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

<<<<<<< HEAD
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
=======
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("users")
      .select(
        "email,username,first_name,last_name,location,skills,socials,github,display_name,bio,updated_at",
      )
      .eq("email", email)
      .maybeSingle();
    if (error) {
      throw new Error(`Failed to fetch user: ${error.message}`);
    }

    const user = data as {
      email: string;
      username: string | null;
      first_name: string | null;
      last_name: string | null;
      location: string | null;
      skills: string[] | null;
      socials: string | null;
      github: string | null;
      display_name: string | null;
      bio: string | null;
      updated_at: string | null;
    } | null;
>>>>>>> e38804f (Change backend to Supabase)

    if (!user) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      profile: {
        email: user.email,
<<<<<<< HEAD
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
=======
        username: user.username ?? "",
        firstName: user.first_name ?? "",
        lastName: user.last_name ?? "",
        location: user.location ?? "",
        skills: user.skills ?? [],
        socials: user.socials ?? "",
        github: user.github ?? "",
        displayName: user.display_name ?? "",
        bio: user.bio ?? "",
        updatedAt: user.updated_at,
>>>>>>> e38804f (Change backend to Supabase)
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

<<<<<<< HEAD
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
=======
    const { email, displayName, bio, username, firstName, lastName, location, skills, socials, github } = parsed.data;

    const sanitize = (value?: string) => {
      if (value === undefined) return null;
      const trimmed = value.trim();
      return trimmed.length ? trimmed : null;
    };

    const sanitizedUsername = sanitize(username);
    const sanitizedFirstName = sanitize(firstName);
    const sanitizedLastName = sanitize(lastName);
    const sanitizedLocation = sanitize(location);
    const sanitizedSocials = sanitize(socials);
    const sanitizedGithub = sanitize(github);
    const sanitizedDisplayName = sanitize(displayName);
    const sanitizedBio = sanitize(bio);

    const normalizedSkills =
      skills?.map(skill => skill.trim()).filter(skill => skill.length > 0) ?? [];

    const supabase = getSupabaseClient();
    const payload = {
      email,
      username: sanitizedUsername,
      first_name: sanitizedFirstName,
      last_name: sanitizedLastName,
      location: sanitizedLocation,
      socials: sanitizedSocials,
      github: sanitizedGithub,
      display_name: sanitizedDisplayName,
      bio: sanitizedBio,
      skills: normalizedSkills,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("users")
      .upsert(payload, { onConflict: "email" })
      .select(
        "email,username,first_name,last_name,location,skills,socials,github,display_name,bio,updated_at",
      )
      .single();

    if (error) {
      throw new Error(`Failed to save profile: ${error.message}`);
    }

    const profile = data as {
      email: string;
      username: string | null;
      first_name: string | null;
      last_name: string | null;
      location: string | null;
      skills: string[] | null;
      socials: string | null;
      github: string | null;
      display_name: string | null;
      bio: string | null;
      updated_at: string | null;
    };

    return NextResponse.json({
      ok: true,
      profile: {
        email: profile.email,
        username: profile.username ?? "",
        firstName: profile.first_name ?? "",
        lastName: profile.last_name ?? "",
        location: profile.location ?? "",
        skills: profile.skills ?? [],
        socials: profile.socials ?? "",
        github: profile.github ?? "",
        displayName: profile.display_name ?? "",
        bio: profile.bio ?? "",
        updatedAt: profile.updated_at,
>>>>>>> e38804f (Change backend to Supabase)
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: "Failed to save profile" }, { status: 500 });
  }
}
