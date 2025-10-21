import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { signSession } from "@/lib/jwt";
import { verifySession } from "@/lib/jwt";

const postSchema = z.object({
    email: z.string().email(),
    otp: z.string().min(6).max(6),
    tokenId: z.string().min(8),
});

// Cho phép verify qua GET (magic link)
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email") ?? "";
    const otp = searchParams.get("otp") ?? "";
    const tokenId = searchParams.get("tokenId") ?? "";
    return verifyCore({ email, otp, tokenId }, /*redirectOnSuccess*/ true);
}

export async function POST(req: NextRequest) {
    const json = await req.json();
    const parsed = postSchema.safeParse(json);
    if (!parsed.success) {
        return NextResponse.json({ ok: false, error: "Invalid payload" }, { status: 400 });
    }
    return verifyCore(parsed.data, false);
}

async function verifyCore(
    data: { email: string; otp: string; tokenId: string },
    redirectOnSuccess: boolean
) {
    try {
        const user = await prisma.user.findUnique({ where: { email: data.email } });
        if (!user) {
            return NextResponse.json({ ok: false, error: "Email không tồn tại" }, { status: 400 });
        }

        const record = await prisma.otpToken.findUnique({
            where: { id: data.tokenId },
        });
        if (!record || record.userId !== user.id) {
            return NextResponse.json({ ok: false, error: "Token không hợp lệ" }, { status: 400 });
        }

        if (record.status !== "PENDING") {
            return NextResponse.json({ ok: false, error: "OTP đã dùng hoặc không còn hiệu lực" }, { status: 400 });
        }

        if (new Date() > record.expiresAt) {
            await prisma.otpToken.update({ where: { id: record.id }, data: { status: "EXPIRED" } });
            return NextResponse.json({ ok: false, error: "OTP hết hạn" }, { status: 400 });
        }

        if (record.attemptsLeft <= 0) {
            await prisma.otpToken.update({ where: { id: record.id }, data: { status: "EXPIRED" } });
            return NextResponse.json({ ok: false, error: "Đã vượt quá số lần thử" }, { status: 400 });
        }

        const ok = await bcrypt.compare(data.otp, record.otpHash);
        if (!ok) {
            await prisma.otpToken.update({
                where: { id: record.id },
                data: { attemptsLeft: record.attemptsLeft - 1 },
            });
            return NextResponse.json({ ok: false, error: "OTP sai" }, { status: 400 });
        }

        // Thành công → đánh dấu USED
        await prisma.otpToken.update({
            where: { id: record.id },
            data: { status: "USED" },
        });

        // Tạo session cookie
        const token = signSession({ userId: user.id, email: user.email });
        (await cookies()).set("session", token, {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            path: "/",
            maxAge: 60 * 60 * 24 * 7, // 7 ngày
        });
        const sessionData = verifySession(token);
        if (redirectOnSuccess) {
            // Điều hướng về trang chủ hoặc dashboard
            return NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"));
        }

        return NextResponse.json({
            ok: true,
            user: {
                email: user.email,
                displayName: user.displayName ?? null,
                bio: user.bio ?? null,
                userId: sessionData?.userId,
            },
        });
    } catch (e: unknown) {
        console.error(e);
        const message = e instanceof Error ? e.message : "Verify error";
        return NextResponse.json({ ok: false, error: message }, { status: 400 });
    }
}
