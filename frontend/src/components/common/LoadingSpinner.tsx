export default function LoadingSpinner({ fullScreen, size = 'md' }: { fullScreen?: boolean; size?: 'sm' | 'md' | 'lg' }) {
  const sizes: Record<string, string> = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' };
  const spinner = (
    <div className={`${sizes[size]} animate-spin rounded-full border-2 border-gray-200 border-t-primary-600`} />
  );
  if (fullScreen) return (
    <div className="fixed inset-0 flex items-center justify-center bg-white dark:bg-gray-900 z-50">
      {spinner}
    </div>
  );
  return spinner;
}
