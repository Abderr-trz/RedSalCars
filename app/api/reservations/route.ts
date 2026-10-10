import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const reservationSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    email: z.email(),
    phone: z.string().trim().min(8).max(24),
    vehicle: z.string().trim().min(2).max(80),
    city: z.string().trim().min(2).max(60),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: "La date de retour doit suivre la date de départ.",
    path: ["endDate"],
  });

export async function POST(request: Request) {
  const result = reservationSchema.safeParse(await request.json());

  if (!result.success) {
    return NextResponse.json(
      { error: "Informations invalides.", issues: result.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ ok: true, demo: true }, { status: 202 });
  }

  const reservation = await prisma.reservation.create({ data: result.data });
  return NextResponse.json({ ok: true, id: reservation.id }, { status: 201 });
}
