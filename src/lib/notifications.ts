import { prisma } from "./prisma";

export async function createNotification(params: {
  userId: string;
  title: string;
  message: string;
  link?: string;
}) {
  try {
    return await prisma.notification.create({
      data: {
        userId: params.userId,
        title: params.title,
        message: params.message,
        link: params.link,
      },
    });
  } catch (error) {
    console.error("Failed to create notification:", error);
    return null;
  }
}
