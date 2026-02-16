export default function WelshDragon({ className = 'w-8 h-8' }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      {/* Simplified Welsh Dragon silhouette */}
      <path d="M56 28c-1-2-3-3-5-3-1 0-2 0-3 1l-2-4c1-2 1-4 0-6-1-3-4-5-7-5-1 0-2 0-3 1-2-3-5-5-9-5-5 0-9 3-11 7l-2-1c-2-1-4 0-5 1-2 2-2 5-1 7l-3 4c-1-1-3-1-4 0-2 1-3 3-3 5 0 3 2 5 4 6l1 2c-1 1-2 3-1 5 0 2 2 4 4 4h2l6 8c1 2 3 3 5 3 1 0 3-1 4-2l3 2c1 1 2 1 3 1 2 0 4-1 5-3l2-4 4 1c2 0 4-1 5-3 1-1 1-3 1-5l3-2c2-2 3-4 3-7 0-2-1-4-2-5zM18 36c-1 0-2-1-2-2s1-2 2-2 2 1 2 2-1 2-2 2zm8-16c0-1 1-2 2-2s2 1 2 2-1 2-2 2-2-1-2-2zm18 20c-1 1-2 1-3 0l-4-3c-1-1-1-2 0-3l6-6c1-1 2-1 3 0l4 4c1 1 1 2 0 3l-6 5z" />
      {/* Wing detail */}
      <path d="M34 18c2-1 4-1 6 0l3 3c1 1 1 3 0 4l-4 4-2-2 3-3-2-2c-1-1-3-1-4 0l-3 3-2-2 3-3c1-1 1-2 2-2z" opacity="0.7" />
      {/* Tail */}
      <path d="M12 42c1 1 3 2 5 2l4-1 2 3-3 2c-3 1-6 0-8-2-2-2-2-5-1-7l3 1c0 1 0 2 1 2h-3z" opacity="0.8" />
    </svg>
  );
}
