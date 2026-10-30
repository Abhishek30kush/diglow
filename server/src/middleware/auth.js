import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import prisma from '../lib/prisma.js';

/**
 * Require valid Admin/Staff/Delivery internal token
 */
export const requireAdminAuth = async (req, res, next) => {
  try {
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No authorization token provided.'
      });
    }

    const decoded = jwt.verify(token, config.jwtSecret);

    if (decoded.type && decoded.type !== 'STAFF') {
      return res.status(401).json({
        success: false,
        message: 'Invalid session. Staff or Admin privileges required.'
      });
    }

    const admin = await prisma.admin.findUnique({
      where: { id: decoded.id },
      select: { id: true, name: true, email: true, role: true }
    });

    if (!admin || !['ADMIN', 'STAFF', 'DELIVERY'].includes(admin.role)) {
      return res.status(401).json({
        success: false,
        message: 'Invalid session. Staff or Admin privileges required.'
      });
    }

    req.admin = admin;
    req.user = admin;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Session expired. Please log in again.'
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid authorization token.'
    });
  }
};

/**
 * Role-Based Access Control helper (e.g. requireRoles('ADMIN', 'STAFF'))
 */
export const requireRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(req.admin.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: '${req.admin.role}' does not have sufficient permissions. Allowed roles: ${allowedRoles.join(', ')}.`
      });
    }

    next();
  };
};

/**
 * Require valid Customer token
 */
export const requireCustomerAuth = async (req, res, next) => {
  try {
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please sign in.'
      });
    }

    const decoded = jwt.verify(token, config.jwtSecret);

    if (decoded.type && decoded.type !== 'CUSTOMER') {
      return res.status(401).json({
        success: false,
        message: 'Invalid session. Customer privileges required.'
      });
    }

    const customer = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, name: true, email: true, phone: true, role: true }
    });

    if (!customer) {
      return res.status(401).json({
        success: false,
        message: 'Customer account not found.'
      });
    }

    req.user = customer;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Session expired. Please sign in again.'
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid authorization token.'
    });
  }
};

/**
 * Optional Customer Auth (attaches req.user if token present, but doesn't block)
 */
export const optionalCustomerAuth = async (req, res, next) => {
  try {
    let token = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      const decoded = jwt.verify(token, config.jwtSecret);
      const customer = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, name: true, email: true, phone: true, role: true }
      });
      if (customer) {
        req.user = customer;
      }
    }
  } catch (err) {
    // Continue without req.user
  }
  next();
};
