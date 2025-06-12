'use client';

import { useState } from 'react';
// import { useAuth } from '@/contexts/AuthContext'; // Removed unused import
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      router.push('/admin/dashboard');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'Failed to create account');
      } else {
        setError('Failed to create account');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-gray-50">
      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-8 shadow-md">
        <div className="mb-6 flex justify-center">
          <Image src="/next.svg" alt="Logo" width={120} height={40} className="dark:invert" />
        </div>
        <h1 className="mb-6 text-center text-2xl font-bold text-gray-900">Create Admin Account</h1>
        
        {error && <div className="mb-4 rounded bg-red-100 p-3 text-red-700">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-gray-300 p-2 text-gray-900 placeholder-gray-400"
              required
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-gray-300 p-2 text-gray-900 placeholder-gray-400"
              required
            />
          </div>

          <div className="mb-6">
            <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-gray-700">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-md border border-gray-300 p-2 text-gray-900 placeholder-gray-400"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-black py-2 text-white hover:bg-gray-800 disabled:bg-gray-400 transition-colors"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>

          <div className="mt-4 text-center">
            <a href="/admin/login" className="text-sm text-blue-600 hover:text-blue-800 transition-colors">
              Already have an account? Login
            </a>
          </div>
        </form>
      </div>
    </div>
  );
} 