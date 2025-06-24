
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle, X, Eye, EyeOff, Lock } from 'lucide-react';

interface PasswordCreationFormProps {
  password: string;
  confirmPassword: string;
  onPasswordChange: (password: string) => void;
  onConfirmPasswordChange: (confirmPassword: string) => void;
}

const PasswordCreationForm: React.FC<PasswordCreationFormProps> = ({
  password,
  confirmPassword,
  onPasswordChange,
  onConfirmPasswordChange,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordRequirements = [
    { label: 'At least 8 characters', check: password.length >= 8 },
    { label: 'Contains uppercase letter', check: /[A-Z]/.test(password) },
    { label: 'Contains lowercase letter', check: /[a-z]/.test(password) },
    { label: 'Contains number', check: /\d/.test(password) },
    { label: 'Contains special character', check: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ];

  const allRequirementsMet = passwordRequirements.every(req => req.check);
  const passwordsMatch = password && confirmPassword && password === confirmPassword;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Password Input */}
      <div className="space-y-2">
        <Label htmlFor="password" className="text-sm font-medium text-gray-700">
          <Lock className="inline h-4 w-4 mr-2" />
          Create Password
        </Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter your password..."
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            className="h-12 pr-12"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Password Requirements */}
      {password && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-gray-50 rounded-lg p-3 sm:p-4"
        >
          <h4 className="text-sm font-medium text-gray-800 mb-2">Password Requirements:</h4>
          <div className="space-y-1">
            {passwordRequirements.map((req, index) => (
              <div key={index} className="flex items-center space-x-2">
                {req.check ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <X className="h-4 w-4 text-gray-400" />
                )}
                <span className={`text-xs sm:text-sm ${req.check ? 'text-green-700' : 'text-gray-600'}`}>
                  {req.label}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Confirm Password Input */}
      <div className="space-y-2">
        <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
          Confirm Password
        </Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Confirm your password..."
            value={confirmPassword}
            onChange={(e) => onConfirmPasswordChange(e.target.value)}
            className={`h-12 pr-12 ${
              confirmPassword && !passwordsMatch ? 'border-red-500 focus:border-red-500' : ''
            } ${
              confirmPassword && passwordsMatch ? 'border-green-500 focus:border-green-500' : ''
            }`}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
          >
            {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        {confirmPassword && !passwordsMatch && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs sm:text-sm text-red-600 flex items-center"
          >
            <X className="h-3 w-3 mr-1" />
            Passwords do not match
          </motion.p>
        )}
        {confirmPassword && passwordsMatch && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs sm:text-sm text-green-600 flex items-center"
          >
            <CheckCircle className="h-3 w-3 mr-1" />
            Passwords match!
          </motion.p>
        )}
      </div>

      {/* Password Strength Indicator */}
      {password && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs sm:text-sm text-gray-600">Password Strength:</span>
            <span className={`text-xs sm:text-sm font-medium ${
              allRequirementsMet ? 'text-green-600' : 'text-orange-600'
            }`}>
              {allRequirementsMet ? 'Strong' : 'Needs improvement'}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                allRequirementsMet ? 'bg-green-500' : 'bg-orange-500'
              }`}
              style={{ width: `${(passwordRequirements.filter(req => req.check).length / passwordRequirements.length) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PasswordCreationForm;
