/**
 * Validates whether a password satisfies the strong password policy.
 * - At least 8 characters long
 * - Contains at least one uppercase letter
 * - Contains at least one lowercase letter
 * - Contains at least one number
 * - Contains at least one special character
 */
const isStrongPassword = (password) => {
  if (!password) return false;
  if (password.length < 8) return false;
  
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  return hasUpper && hasLower && hasDigit && hasSpecial;
};

/**
 * Returns the strength score/label of a password as the user types:
 * - 'Weak': length < 8 or meets <= 2 criteria
 * - 'Medium': length >= 8 and meets 3 criteria
 * - 'Strong': length >= 8 and meets all 4 criteria
 */
const getPasswordStrength = (password) => {
  if (!password) return 'Weak';
  
  const criteria = [
    /[A-Z]/.test(password),
    /[a-z]/.test(password),
    /[0-9]/.test(password),
    /[!@#$%^&*(),.?":{}|<>]/.test(password)
  ];
  
  const metCount = criteria.filter(Boolean).length;
  
  if (password.length < 8) {
    return 'Weak';
  }
  
  if (metCount === 4) {
    return 'Strong';
  } else if (metCount === 3) {
    return 'Medium';
  } else {
    return 'Weak';
  }
};

module.exports = {
  isStrongPassword,
  getPasswordStrength
};
