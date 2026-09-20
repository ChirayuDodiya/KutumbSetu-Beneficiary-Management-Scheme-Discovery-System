const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_hackathon';

/**
 * Hash a plain text password
 */
const hashPassword = async (password) => {
  return await bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * Compare a plain text password with a hashed one
 */
const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

/**
 * Generate a JWT for a user
 * @param {Object} user 
 * @param {Object} officerDetails (optional) if the user is an officer
 */
const generateToken = (user, officerDetails = null) => {
  const payload = {
    userId: user.id,
    role: user.role,
  };

  if (officerDetails) {
    payload.village = officerDetails.village;
    payload.district = officerDetails.district;
  }

  return jwt.sign(payload, JWT_SECRET, { expiresIn: '12h' });
};

/**
 * Verify a JWT and extract the payload
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken
};
