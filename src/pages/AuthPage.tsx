import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/AuthContext';
import { Shield, Mail } from 'lucide-react';

export default function AuthPage() {
  const { signIn, signUp, error } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [cooldown, setCooldown] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmationMessage, setShowConfirmationMessage] = useState(false);

  useEffect(() => {
    let timer: number;
    if (cooldown > 0) {
      timer = window.setInterval(() => {
        setCooldown(prev => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [cooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cooldown > 0 || isSubmitting) return;

    setIsSubmitting(true);
    setShowConfirmationMessage(false);
    try {
      if (isSignUp) {
        await signUp(formData.email, formData.password);
        setShowConfirmationMessage(true);
      } else {
        await signIn(formData.email, formData.password);
      }
    } catch (err) {
      console.error('Authentication error:', err);
      if (err instanceof Error && err.message.toLowerCase().includes('email not confirmed')) {
        setShowConfirmationMessage(true);
      }
      if (err instanceof Error && err.message.includes('rate limit')) {
        setCooldown(60);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const getButtonText = () => {
    if (cooldown > 0) {
      return `Try again in ${cooldown}s`;
    }
    if (isSubmitting) {
      return 'Processing...';
    }
    return isSignUp ? 'Sign up' : 'Sign in';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100">
          <Shield className="h-6 w-6 text-indigo-600" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          {isSignUp ? 'Create your account' : 'Sign in to your account'}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {showConfirmationMessage && (
            <div className="mb-4 rounded-md bg-blue-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Mail className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Email Confirmation Required</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>Please check your email and click the confirmation link to verify your account. You won't be able to sign in until your email is confirmed.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && !showConfirmationMessage && (
            <div className="mb-4 rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={cooldown > 0 || isSubmitting}
                className={`flex w-full justify-center rounded-md border border-transparent py-2 px-4 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                  cooldown > 0 || isSubmitting
                    ? 'bg-indigo-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                {getButtonText()}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setShowConfirmationMessage(false);
              }}
              className="text-sm text-indigo-600 hover:text-indigo-500"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}