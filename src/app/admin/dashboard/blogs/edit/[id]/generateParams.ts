import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function generateStaticParams() {
  // Fetch all blog IDs from Firestore
  const blogsSnapshot = await getDocs(collection(db, 'blogs'));
  return blogsSnapshot.docs.map(doc => ({
    id: doc.id
  }));
}