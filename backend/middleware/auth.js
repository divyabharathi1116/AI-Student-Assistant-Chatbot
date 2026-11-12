import jwt from 'jsonwebtoken';
import { storeService } from '../services/storeService.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_ai_student_assistant_jwt_token_key_2026';

export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    let userId = null;
    let user = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        userId = decoded.userId;
        user = await storeService.findUserById(userId);
      } catch (err) {
        // Invalid or expired token, fall back to guest check
      }
    }

    if (!user) {
      // Check for guest user header
      const guestId = req.headers['x-guest-id'] || req.query.guestId;
      if (guestId) {
        userId = `guest_${guestId}`;
        user = {
          _id: userId,
          name: 'Student Guest',
          email: `${userId}@guest.local`,
          studentMajor: 'Computer Science & Engineering',
          isGuest: true,
        };
      } else {
        // Generate automatic default guest ID
        const defaultGuestId = 'guest_default_student';
        userId = defaultGuestId;
        user = {
          _id: defaultGuestId,
          name: 'Student Guest',
          email: `${defaultGuestId}@guest.local`,
          studentMajor: 'General Studies',
          isGuest: true,
        };
      }
    }

    req.user = user;
    req.userId = user._id ? user._id.toString() : userId;
    next();
  } catch (error) {
    console.error('[Auth Middleware] Error:', error);
    next();
  }
};
