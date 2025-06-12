'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      await login(email, password);
    } catch {
      setError('Failed to login. Please check your credentials.');
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-gray-50">
      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-8 shadow-md">
        <div className="mb-6 flex justify-center">
          <Image src="/next.svg" alt="Logo" width={120} height={40} className="dark:invert" />
        </div>
        <h1 className="mb-6 text-center text-2xl font-bold text-gray-900">Admin Login</h1>
        
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
          
          <div className="mb-6">
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
          
          <button
            type="submit"
            className="w-full rounded-md bg-black py-2 text-white hover:bg-gray-800 transition-colors"
          >
            Login
          </button>

          <div className="mt-4 text-center">
            <a href="/admin/signup" className="text-sm text-blue-600 hover:text-blue-800 transition-colors">
              Need an account? Sign up
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}