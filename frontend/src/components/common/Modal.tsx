import { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  footer?: React.ReactNode;
}

export default function Modal({ open, onClose, title, children, size = 'md', footer }: ModalProps) {
  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl', full: 'max-w-6xl' };

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-end sm:items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <div className={`relative w-full ${sizes[size]} bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden`}>
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h3>
            <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700">
              <X size={18} />
            </button>
          </div>
          {/* Body */}
          <div className="px-5 py-4 overflow-y-auto max-h-[70vh]">
            {children}
          </div>
          {/* Footer */}
          {footer && (
            <div className="px-5 py-3 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
