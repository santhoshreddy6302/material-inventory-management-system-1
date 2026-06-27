import { prisma } from '../config/database';


export const createAlert = async (params: {
  type: string;
  title: string;
  message: string;
  materialId?: number;
  siteId?: number;
  poId?: number;
  severity?: string;
}) => {
  try {
    const alert = await prisma.alert.create({
      data: {
        type: params.type,
        title: params.title,
        message: params.message,
        materialId: params.materialId,
        siteId: params.siteId,
        poId: params.poId,
        severity: params.severity || "medium",
      }
    });
    console.log(`[ALERT] Created: ${params.title} (${params.severity || 'medium'})`);
    return alert;
  } catch (err) {
    console.error('❌ Failed to create database alert:', err);
    return null;
  }
};

export const sendNotification = async (userId: number, message: string) => {
  // Stub for user-specific real-time notifications
  console.log(`Notification to user ${userId}: ${message}`);
  return true;
};
