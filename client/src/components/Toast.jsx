import { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export default function Toast({ message, type = 'error', onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 5000);
    return () => clearTimeout(t);
  }, [onClose]);

  const styles = {
    error: 'bg-red-500/10 border-red-500/40 text-red-400',
    success: 'bg-green-500/10 border-green-500/40 text-green-400',
    info: 'bg-blue-500/10 border-blue-500/40 text-blue-400',
  };
  const Icon = type === 'error' ? AlertCircle : type === 'success' ? CheckCircle : Info;

  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-xl border shadow-xl max-w-sm w-full mx-4 ${styles[type]} fade-in`}>
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span className="text-sm flex-1">{message}</span>
      <button onClick={onClose} className="flex-shrink-0 hover:opacity-70">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
