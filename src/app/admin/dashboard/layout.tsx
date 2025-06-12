'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { logout } = useAuth();
  return (
    <ProtectedRoute>
      <div className="flex min-h-screen flex-col bg-gray-50">
        <header className="bg-gray-900 text-white p-4 shadow-md">
          <div className="container mx-auto flex items-center justify-between">
            <h1 className="text-xl font-bold">GBI Admin Panel</h1>
            <button 
              onClick={logout} 
              className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </header>

        <div className="flex flex-1">
          <nav className="w-64 bg-white p-4 shadow-md">
            <ul className="space-y-2">
              <li>
                <Link 
                  href="/admin/dashboard" 
                  className="block rounded p-2 text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link 
                  href="/admin/dashboard/blogs" 
                  className="block rounded p-2 text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                >
                  Blogs
                </Link>
              </li>
              <li>
                <Link 
                  href="/admin/dashboard/investor" 
                  className="block rounded p-2 text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                >
                  Investor Documents
                </Link>
              </li>
              <li>
                <Link 
                  href="/admin/dashboard/internship" 
                  className="block rounded p-2 text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                >
                  Internship
                </Link>
              </li>
              <li>
                <Link 
                  href="/admin/dashboard/products" 
                  className="block rounded p-2 text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                >
                  Pickle Products
                </Link>
              </li>
              <li>
                <Link 
                  href="/admin/dashboard/handicraft" 
                  className="block rounded p-2 text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                >
                  Decorative Handicraft
                </Link>
              </li>
              <li>
                <Link 
                  href="/admin/dashboard/rice" 
                  className="block rounded p-2 text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                >
                  Rice
                </Link>
              </li>
              <li>
                <Link 
                  href="/admin/dashboard/contacts" 
                  className="block rounded p-2 text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                >
                  Contacts
                </Link>
              </li>
            </ul>
          </nav>

          <main className="flex-1 p-6 bg-gray-50">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );

}