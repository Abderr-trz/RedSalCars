import { NextResponse } from "next/server";
import { z } from "zod";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const reservationSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    email: z.string().trim().email(),
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
  try {
    const body = await request.json();
    const result = reservationSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Informations invalides.",
          issues: result.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const prisma = getPrisma();

    // If no database is configured (e.g. demo mode or initial Vercel deploy)
    if (!prisma) {
      return NextResponse.json({ ok: true, demo: true }, { status: 202 });
    }

    const reservation = await prisma.reservation.create({
      data: result.data,
    });

    return NextResponse.json(
      { ok: true, id: reservation.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Reservation error:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de l'enregistrement." },
      { status: 500 }
    );
  }
}
