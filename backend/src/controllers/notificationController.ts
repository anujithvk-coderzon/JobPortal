import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../types';

export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const notifications = await prisma.notification.findMany({
      where: {
        userId: req.user.userId,
        isRead: false,
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({
      success: true,
      data: notifications,
    });
  } catch (error: any) {
    console.error('Get notifications error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch notifications',
    });
  }
};

export const markAsRead = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const { notificationId } = req.params;

    // Delete the notification after reading
    await prisma.notification.delete({
      where: {
        id: notificationId,
        userId: req.user.userId, // Ensure user owns this notification
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Notification deleted successfully',
    });
  } catch (error: any) {
    console.error('Mark notification as read error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to mark notification as read',
    });
  }
};

export const getUnreadCount = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const count = await prisma.notification.count({
      where: {
        userId: req.user.userId,
        isRead: false,
      },
    });

    return res.status(200).json({
      success: true,
      data: { count },
    });
  } catch (error: any) {
    console.error('Get unread count error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get unread count',
    });
  }
};
