'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

export default function Dashboard() {
  const [stats, setStats] = useState({
    blogs: 0,
    investorDocs: 0,
    internships: 0,
    products: 0,
    handicraftProducts: 0,
    riceProducts: 0,
  });

  useEffect(() => {
    async function fetchStats() {
      try {
        const blogsSnapshot = await getDocs(collection(db, 'blogs'));
        const investorDocsSnapshot = await getDocs(collection(db, 'investorDocuments'));
        const internshipsSnapshot = await getDocs(collection(db, 'internships'));
        const productsSnapshot = await getDocs(collection(db, 'products'));
        const handicraftProductsSnapshot = await getDocs(collection(db, 'handicraftProducts'));
        const riceProductsSnapshot = await getDocs(collection(db, 'riceProducts'));

        setStats({
          blogs: blogsSnapshot.size,
          investorDocs: investorDocsSnapshot.size,
          internships: internshipsSnapshot.size,
          products: productsSnapshot.size,
          handicraftProducts: handicraftProductsSnapshot.size,
          riceProducts: riceProductsSnapshot.size,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    }

    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
      
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg bg-white p-6 shadow-md transition-shadow hover:shadow-lg">
          <h2 className="text-lg font-semibold text-gray-700">Blogs</h2>
          <p className="mt-2 text-3xl font-bold text-gray-900">{stats.blogs}</p>
        </div>
        
        <div className="rounded-lg bg-white p-6 shadow-md transition-shadow hover:shadow-lg">
          <h2 className="text-lg font-semibold text-gray-700">Investor Documents</h2>
          <p className="mt-2 text-3xl font-bold text-gray-900">{stats.investorDocs}</p>
        </div>
        
        <div className="rounded-lg bg-white p-6 shadow-md transition-shadow hover:shadow-lg">
          <h2 className="text-lg font-semibold text-gray-700">Internships</h2>
          <p className="mt-2 text-3xl font-bold text-gray-900">{stats.internships}</p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-md transition-shadow hover:shadow-lg">
          <h2 className="text-lg font-semibold text-gray-700">Pickle Products</h2>
          <p className="mt-2 text-3xl font-bold text-gray-900">{stats.products}</p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-md transition-shadow hover:shadow-lg">
          <h2 className="text-lg font-semibold text-gray-700">Decorative Handicraft</h2>
          <p className="mt-2 text-3xl font-bold text-gray-900">{stats.handicraftProducts}</p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-md transition-shadow hover:shadow-lg">
          <h2 className="text-lg font-semibold text-gray-700">Rice</h2>
          <p className="mt-2 text-3xl font-bold text-gray-900">{stats.riceProducts}</p>
        </div>
      </div>
    </div>
  );
}