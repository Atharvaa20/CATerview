/**
 * Generates a random 6-digit OTP
 * @returns {string} 6-digit OTP
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Calculates the expiration time for OTP
 * @param {number} minutes - Number of minutes until expiration (default: 10)
 * @returns {Date} Expiration date
 */
const getOtpExpiryTime = (minutes = 10) => {
  const now = new Date();
  return new Date(now.getTime() + minutes * 60000);
};

/**
 * Checks if OTP is expired
 * @param {Date} expiryTime - OTP expiration time
 * @returns {boolean} True if OTP is expired, false otherwise
 */
const isOtpExpired = (expiryTime) => {
  if (!expiryTime) return true;
  return new Date() > new Date(expiryTime);
};

module.exports = {
  generateOTP,
  getOtpExpiryTime,
  isOtpExpired,
};
