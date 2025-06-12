import { AuthProvider } from '@/contexts/AuthContext';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'GBI Admin Panel',
  description: 'Admin panel for Green Business Initiative',
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}