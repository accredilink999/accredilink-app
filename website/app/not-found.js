import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-6xl font-bold text-welsh-red mb-4">404</p>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Page Not Found</h1>
        <p className="text-slate-600 mb-8">Sorry, the page you're looking for doesn't exist.</p>
        <Link
          href="/"
          className="inline-flex items-center justify-center px-6 py-3 bg-welsh-red text-white font-semibold rounded-xl hover:bg-welsh-red-light transition-colors"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
