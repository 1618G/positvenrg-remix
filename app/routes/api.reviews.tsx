import { json, type ActionFunctionArgs } from "@remix-run/node";
import { verifyUserSession, getUserById } from "~/lib/auth.server";
import { db } from "~/lib/db.server";
import { getAppointment } from "~/lib/appointment.server";
import { updateCompanionRating } from "~/lib/companion.server";
import logger from "~/lib/logger.server";
import { z } from "zod";

const reviewSchema = z.object({
  appointmentId: z.string(),
  companionId: z.string(),
  rating: z.number().min(1).max(5),
  reviewText: z.string().max(1000).optional(),
  isPublic: z.boolean().default(true),
});

export async function action({ request }: ActionFunctionArgs) {
  // Verify authentication
  const cookieHeader = request.headers.get("Cookie");
  const token = cookieHeader
    ?.split(";")
    .find((c) => c.trim().startsWith("token="))
    ?.split("=")[1];

  if (!token) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const session = verifyUserSession(token);
  if (!session) {
    return json({ error: "Invalid session" }, { status: 401 });
  }

  const user = await getUserById(session.userId);
  if (!user) {
    return json({ error: "User not found" }, { status: 404 });
  }

  try {
    const formData = await request.formData();
    const data = {
      appointmentId: formData.get("appointmentId") as string,
      companionId: formData.get("companionId") as string,
      rating: parseInt(formData.get("rating") as string),
      reviewText: formData.get("reviewText") as string | undefined,
      isPublic: formData.get("isPublic") !== "false",
    };

    // Validate input
    const validated = reviewSchema.parse(data);

    // Verify appointment exists and belongs to user
    const appointment = await getAppointment(validated.appointmentId);
    if (!appointment) {
      return json({ error: "Appointment not found" }, { status: 404 });
    }

    if (appointment.userId !== user.id) {
      return json({ error: "Unauthorized" }, { status: 403 });
    }

    if (appointment.status !== "COMPLETED") {
      return json({ error: "Can only review completed appointments" }, { status: 400 });
    }

    // Check if review already exists
    const existing = await db.companionReview.findUnique({
      where: { appointmentId: validated.appointmentId },
    });

    if (existing) {
      return json({ error: "Review already submitted" }, { status: 400 });
    }

    // Create review
    const review = await db.companionReview.create({
      data: {
        appointmentId: validated.appointmentId,
        companionId: validated.companionId,
        userId: user.id,
        rating: validated.rating,
        reviewText: validated.reviewText,
        isPublic: validated.isPublic,
      },
    });

    // Update appointment with rating
    await db.appointment.update({
      where: { id: validated.appointmentId },
      data: {
        userRating: validated.rating,
        userReview: validated.reviewText,
      },
    });

    // Update companion rating
    await updateCompanionRating(validated.companionId);

    logger.info(
      { reviewId: review.id, appointmentId: validated.appointmentId, companionId: validated.companionId },
      "Review created"
    );

    return json({ success: true, review });
  } catch (error) {
    logger.error(
      { error: error instanceof Error ? error.message : "Unknown error", userId: user.id },
      "Error creating review"
    );
    return json(
      { error: error instanceof Error ? error.message : "Failed to create review" },
      { status: 400 }
    );
  }
}

