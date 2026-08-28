import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const currentUser = await getAuthenticatedUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isDatabaseConfigured) {
    return NextResponse.json({
      notifications: [],
      unreadCount: 0,
    });
  }

  try {
    const notifications = await prisma.notificationQueue.findMany({
      where: {
        recipientId: currentUser.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 12,
    });

    const formatted = notifications.map((n) => {
      const payload = (n.payload as Record<string, unknown>) || {};
      const trackingNumber = (payload.trackingNumber as string) || null;
      const documentId = (payload.documentId as string) || null;
      const title = (payload.title as string) || null;

      return {
        id: n.id,
        subject: n.subject,
        type: n.type,
        status: n.status,
        createdAt: n.createdAt,
        trackingNumber,
        documentId,
        title,
      };
    });

    return NextResponse.json({
      notifications: formatted,
      unreadCount: formatted.filter((n) => n.status === "PENDING" || n.status === "FAILED").length,
    });
  } catch (error) {
    console.error("[NOTIFICATIONS_API_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to load notifications", notifications: [], unreadCount: 0 },
      { status: 500 }
    );
  }
}
