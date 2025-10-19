import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { addSeconds, generateNumericOTP, safeNumberEnv } from "@/lib/otp";
import { sendOtpEmail } from "@/lib/mailer";

const bodySchema = z.object({
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const { email } = bodySchema.parse(json);

    // Tìm hoặc tạo user theo email
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({ data: { email } });
    }

    const OTP_TTL_SECONDS = safeNumberEnv("OTP_TTL_SECONDS", 300);
    const OTP_MAX_ATTEMPTS = safeNumberEnv("OTP_MAX_ATTEMPTS", 5);

    // Tạo OTP & tokenId
    const otp = generateNumericOTP(6);
    const otpHash = await bcrypt.hash(otp, 10);

    // (Tuỳ chọn) Có thể vô hiệu hoá các OTP cũ còn PENDING cho user này tại đây
    await prisma.otpToken.updateMany({
      where: { userId: user.id, status: "PENDING" },
      data: { status: "EXPIRED" },
    });

    // Lưu OTP
    const otpRecord = await prisma.otpToken.create({
      data: {
        userId: user.id,
        otpHash,
        expiresAt: addSeconds(new Date(), OTP_TTL_SECONDS),
        attemptsLeft: OTP_MAX_ATTEMPTS,
        status: "PENDING",
      },
    });

    // Gửi mail
    await sendOtpEmail(email, otp, otpRecord.id);

    return NextResponse.json({ ok: true, tokenId: otpRecord.id });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ ok: false, error: e.message ?? "Bad Request" }, { status: 400 });
  }
}
