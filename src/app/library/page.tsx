import { redirect } from 'next/navigation';

// Redirecciona la antigua URL /library a /dashboard/library
export default function LibraryPageRedirect() {
  redirect('/dashboard/library');
}