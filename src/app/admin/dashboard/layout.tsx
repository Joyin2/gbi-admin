'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

// Navigation item interface
interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  color: string;
  badge?: string;
}

// Navigation section interface
interface NavSection {
  title: string;
  items: NavItem[];
  collapsible?: boolean;
}

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { logout, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close sidebar on mobile when route changes
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [pathname, isMobile]);

  // Toggle section collapse
  const toggleSection = (sectionTitle: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionTitle]: !prev[sectionTitle]
    }));
  };

  // Check if current path is active
  const isActive = (href: string) => {
    if (href === '/admin/dashboard') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  // Navigation sections
  const navigationSections: NavSection[] = [
    {
      title: 'Main',
      items: [
        {
          name: 'Dashboard',
          href: '/admin/dashboard',
          icon: (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
            </svg>
          ),
          color: 'blue'
        }
      ]
    },
    {
      title: 'Content Management',
      collapsible: true,
      items: [
        {
          name: 'Blogs',
          href: '/admin/dashboard/blogs',
          icon: (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2.5 2.5 0 00-2.5-2.5H15" />
            </svg>
          ),
          color: 'blue'
        },
        {
          name: 'Investor Documents',
          href: '/admin/dashboard/investor',
          icon: (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          ),
          color: 'blue'
        },
        {
          name: 'Internships',
          href: '/admin/dashboard/internship',
          icon: (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6" />
            </svg>
          ),
          color: 'blue'
        }
      ]
    },
    {
      title: 'Products',
      collapsible: true,
      items: [
        {
          name: 'Pickle Products',
          href: '/admin/dashboard/products',
          icon: (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          ),
          color: 'green'
        },
        {
          name: 'Handicraft Products',
          href: '/admin/dashboard/handicraft',
          icon: (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
            </svg>
          ),
          color: 'purple'
        },
        {
          name: 'Rice Products',
          href: '/admin/dashboard/rice',
          icon: (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          color: 'yellow'
        }
      ]
    },
    {
      title: 'Community',
      collapsible: true,
      items: [
        {
          name: 'Team Members',
          href: '/admin/dashboard/team',
          icon: (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          ),
          color: 'indigo'
        },
        {
          name: 'Ecovillage Gallery',
          href: '/admin/dashboard/ecovillage',
          icon: (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          ),
          color: 'emerald'
        }
      ]
    },
    {
      title: 'Website Management',
      collapsible: true,
      items: [
        {
          name: 'Hero Text',
          href: '/admin/dashboard/hero-text',
          icon: (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          ),
          color: 'orange'
        },
        {
          name: 'Contact Submissions',
          href: '/admin/dashboard/contacts',
          icon: (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          ),
          color: 'pink'
        }
      ]
    }
  ];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-white">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && isMobile && (
          <div
            className="fixed inset-0 z-30 bg-black bg-opacity-50"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Header */}
        <header className="shadow-lg border-b border-gray-200 fixed top-0 left-0 right-0 z-50 bg-white">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Menu buttons */}
              <div className="flex items-center space-x-4">
                {/* Mobile menu button */}
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="lg:hidden p-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {sidebarOpen ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    )}
                  </svg>
                </button>

                {/* Desktop sidebar toggle button */}
                <button
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="hidden lg:flex p-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                  title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {sidebarCollapsed ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7M19 19l-7-7 7-7" />
                    )}
                  </svg>
                </button>

                {/* Logo */}
                <div className="flex items-center">
                  <div className="h-10 w-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-lg">GBI</span>
                  </div>
                  <div className="ml-3 hidden sm:block">
                    <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                      Admin Panel
                    </h1>
                    <p className="text-xs text-gray-500">Green Business Initiative</p>
                  </div>
                </div>
              </div>

              {/* User menu */}
              <div className="flex items-center space-x-3">
                {/* Status indicator */}
                <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 bg-green-50 rounded-full">
                  <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-green-700">Online</span>
                </div>

                {/* User avatar */}
                <div className="hidden sm:flex items-center space-x-3 px-3 py-1.5 bg-gray-50 rounded-xl">
                  <div className="h-8 w-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {user?.email?.charAt(0).toUpperCase() || 'A'}
                    </span>
                  </div>
                  <div className="hidden lg:block">
                    <p className="text-sm font-medium text-gray-900">
                      {user?.displayName || 'Admin User'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {user?.email || 'admin@gbillp.com'}
                    </p>
                  </div>
                </div>

                {/* Logout button */}
                <button
                  onClick={logout}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <svg className="w-4 h-4 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="flex flex-1 h-screen pt-16">
          {/* Sidebar */}
          <nav className={`${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0 fixed lg:fixed inset-y-0 lg:top-16 left-0 z-40 ${
            sidebarCollapsed ? 'w-20' : 'w-72'
          } bg-white shadow-2xl lg:shadow-xl transition-all duration-300 ease-in-out flex-shrink-0 border-r border-gray-200`}>
            <div className="h-full lg:h-[calc(100vh-4rem)] flex flex-col">
              {/* Sidebar header */}
              <div className="p-6 border-b border-gray-200 lg:hidden flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="h-10 w-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                      <span className="text-white font-bold text-lg">GBI</span>
                    </div>
                    <div className="ml-3">
                      <span className="text-lg font-bold text-gray-900">Admin Panel</span>
                      <p className="text-xs text-gray-500">Green Business Initiative</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex-1 px-3 overflow-y-auto pt-20 lg:pt-6 pb-6">
                <nav className="space-y-1">
                  {navigationSections.map((section) => (
                    <div key={section.title} className={`mb-6 ${sidebarCollapsed ? 'mb-2' : ''}`}>
                      {/* Section Header */}
                      {!sidebarCollapsed && (
                        <div className="flex items-center justify-between mb-3 px-3">
                          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                            {section.title}
                          </h3>
                          {section.collapsible && (
                            <button
                              onClick={() => toggleSection(section.title)}
                              className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                            >
                              <svg
                                className={`h-4 w-4 transform transition-transform duration-200 ${
                                  collapsedSections[section.title] ? 'rotate-0' : 'rotate-90'
                                }`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                          )}
                        </div>
                      )}

                      {/* Collapsed section divider */}
                      {sidebarCollapsed && section.title !== 'Main' && (
                        <div className="my-4 border-t border-gray-200"></div>
                      )}

                      {/* Section Items */}
                      <div className={`space-y-1 transition-all duration-300 ${
                        !sidebarCollapsed && section.collapsible && collapsedSections[section.title]
                          ? 'max-h-0 overflow-hidden opacity-0'
                          : 'max-h-96 opacity-100'
                      }`}>
                        {section.items.map((item) => {
                          const active = isActive(item.href);
                          const colorClasses = {
                            blue: active
                              ? 'bg-blue-100 text-blue-700 border-blue-200'
                              : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50',
                            green: active
                              ? 'bg-green-100 text-green-700 border-green-200'
                              : 'text-gray-700 hover:text-green-600 hover:bg-green-50',
                            purple: active
                              ? 'bg-purple-100 text-purple-700 border-purple-200'
                              : 'text-gray-700 hover:text-purple-600 hover:bg-purple-50',
                            yellow: active
                              ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
                              : 'text-gray-700 hover:text-yellow-600 hover:bg-yellow-50',
                            indigo: active
                              ? 'bg-indigo-100 text-indigo-700 border-indigo-200'
                              : 'text-gray-700 hover:text-indigo-600 hover:bg-indigo-50',
                            emerald: active
                              ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                              : 'text-gray-700 hover:text-emerald-600 hover:bg-emerald-50',
                            orange: active
                              ? 'bg-orange-100 text-orange-700 border-orange-200'
                              : 'text-gray-700 hover:text-orange-600 hover:bg-orange-50',
                            pink: active
                              ? 'bg-pink-100 text-pink-700 border-pink-200'
                              : 'text-gray-700 hover:text-pink-600 hover:bg-pink-50',
                          };

                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              className={`group flex items-center ${
                                sidebarCollapsed ? 'px-3 py-3 justify-center' : 'px-3 py-2.5'
                              } text-sm font-medium rounded-xl transition-all duration-200 ${
                                active
                                  ? `${colorClasses[item.color as keyof typeof colorClasses]} border shadow-sm`
                                  : `${colorClasses[item.color as keyof typeof colorClasses]} border border-transparent`
                              } relative`}
                              title={sidebarCollapsed ? item.name : ''}
                            >
                              <div className={`${
                                sidebarCollapsed ? '' : 'mr-3'
                              } h-5 w-5 transition-colors ${
                                active
                                  ? `text-${item.color}-600`
                                  : `text-gray-400 group-hover:text-${item.color}-500`
                              }`}>
                                {item.icon}
                              </div>
                              {!sidebarCollapsed && (
                                <>
                                  <span className="flex-1">{item.name}</span>
                                  {item.badge && (
                                    <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                                      {item.badge}
                                    </span>
                                  )}
                                  {active && (
                                    <div className={`ml-2 h-2 w-2 bg-${item.color}-500 rounded-full`}></div>
                                  )}
                                </>
                              )}
                              {sidebarCollapsed && active && (
                                <div className={`absolute -right-1 top-1/2 transform -translate-y-1/2 h-3 w-1 bg-${item.color}-500 rounded-full`}></div>
                              )}

                              {/* Tooltip for collapsed state */}
                              {sidebarCollapsed && (
                                <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                                  {item.name}
                                  <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                                </div>
                              )}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </nav>
              </div>

              {/* Sidebar footer */}
              <div className={`border-t border-gray-200 bg-gray-50 flex-shrink-0 ${sidebarCollapsed ? 'p-3' : 'p-6'}`}>
                {sidebarCollapsed ? (
                  /* Collapsed footer */
                  <div className="flex flex-col items-center space-y-3">
                    <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg relative group">
                      <span className="text-white text-sm font-bold">
                        {user?.email?.charAt(0).toUpperCase() || 'A'}
                      </span>
                      {/* Tooltip */}
                      <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                        {user?.displayName || 'Admin User'}
                        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                      </div>
                    </div>
                    <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></div>
                  </div>
                ) : (
                  /* Expanded footer */
                  <>
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                        <span className="text-white text-sm font-bold">
                          {user?.email?.charAt(0).toUpperCase() || 'A'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">
                          {user?.displayName || 'Admin User'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {user?.email || 'admin@gbillp.com'}
                        </p>
                      </div>
                      <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </nav>

          {/* Main content */}
          <main className={`flex-1 min-w-0 bg-white transition-all duration-300 ${
            sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-72'
          }`}>
            <div className="min-h-[calc(100vh-4rem)] overflow-y-auto">
              {/* Content wrapper */}
              <div className="px-4 sm:px-6 lg:px-8 py-8">
                <div className="max-w-7xl mx-auto">
                  {children}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}