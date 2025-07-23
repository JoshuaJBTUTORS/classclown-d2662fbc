// Validation and security utilities

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): {
  isValid: boolean;
  requirements: Array<{ name: string; met: boolean }>;
} => {
  const requirements = [
    { name: 'At least 8 characters', met: password.length >= 8 },
    { name: 'Contains uppercase letter', met: /[A-Z]/.test(password) },
    { name: 'Contains lowercase letter', met: /[a-z]/.test(password) },
    { name: 'Contains number', met: /\d/.test(password) },
    { name: 'Contains special character', met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ];

  const isValid = requirements.every(req => req.met);
  
  return { isValid, requirements };
};

export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
};

export const calculatePasswordStrength = (password: string): {
  score: number;
  label: string;
  color: string;
} => {
  const { requirements } = validatePassword(password);
  const metCount = requirements.filter(req => req.met).length;
  
  let score = (metCount / requirements.length) * 100;
  let label = 'Very Weak';
  let color = 'destructive';
  
  if (score >= 80) {
    label = 'Strong';
    color = 'success';
  } else if (score >= 60) {
    label = 'Good';
    color = 'warning';
  } else if (score >= 40) {
    label = 'Fair';
    color = 'warning';
  } else if (score >= 20) {
    label = 'Weak';
    color = 'destructive';
  }
  
  return { score, label, color };
};