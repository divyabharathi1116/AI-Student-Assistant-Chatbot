import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { storeService } from '../services/storeService.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_ai_student_assistant_jwt_token_key_2026';

export const register = async (req, res) => {
  try {
    const { name, email, password, studentMajor, studyGoal } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const existingUser = await storeService.findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'A student account with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await storeService.createUser({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      studentMajor: studentMajor ? studentMajor.trim() : 'Computer Science & Engineering',
      studyGoal: studyGoal ? studyGoal.trim() : 'Ace coursework and exams',
    });

    const token = jwt.sign({ userId: newUser._id }, JWT_SECRET, { expiresIn: '30d' });

    res.status(201).json({
      message: 'Account created successfully!',
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        studentMajor: newUser.studentMajor,
        studyGoal: newUser.studyGoal,
      },
    });
  } catch (error) {
    console.error('[Register] Error:', error);
    res.status(500).json({ error: 'Server error during registration. Please try again.' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await storeService.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '30d' });

    res.json({
      message: 'Login successful!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        studentMajor: user.studentMajor || 'General Studies',
        studyGoal: user.studyGoal || 'Excel in academics',
      },
    });
  } catch (error) {
    console.error('[Login] Error:', error);
    res.status(500).json({ error: 'Server error during login. Please try again.' });
  }
};

export const getMe = async (req, res) => {
  try {
    if (req.user) {
      return res.json({
        user: {
          id: req.user._id,
          name: req.user.name,
          email: req.user.email,
          studentMajor: req.user.studentMajor || 'General Studies',
          studyGoal: req.user.studyGoal || 'Excel in academics',
          isGuest: !!req.user.isGuest,
        },
      });
    }
    res.status(401).json({ error: 'Not authenticated' });
  } catch (error) {
    console.error('[GetMe] Error:', error);
    res.status(500).json({ error: 'Failed to retrieve profile.' });
  }
};
