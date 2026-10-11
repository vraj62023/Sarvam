import { useState, useEffect } from 'react';
import { X, Clock, ChevronRight } from 'lucide-react';
import { getHistory, getAnalysis } from '../api';
import { URGENCY_COLORS } from '../constants';

export default function HistoryDrawer({ open, onClose, onSelect }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setLoading(true);
      getHistory()
        .then(setHistory)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [open]);

  const handleSelect = async (item) => {
    try {
      const full = await getAnalysis(item._id);
      onSelect(full, full.lang || 'hi-IN');
      onClose();
    } catch (e) {
      console.error(e);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative ml-auto w-full max-w-sm h-full bg-navy-900 border-l border-navy-700 flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-navy-700">
          <h2 className="font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-saffron-400" /> Recent Documents
          </h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-navy-700 text-slate-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {loading && <p className="text-slate-500 text-sm text-center py-8">Loading…</p>}
          {!loading && history.length === 0 && (
            <p className="text-slate-500 text-sm text-center py-8">No history yet. Analyze your first document!</p>
          )}
          {history.map(item => {
            const uc = URGENCY_COLORS[item.urgency] || URGENCY_COLORS.medium;
            return (
              <button
                key={item._id}
                onClick={() => handleSelect(item)}
                className="w-full text-left p-4 rounded-xl mb-2 bg-navy-800 hover:bg-navy-700 border border-navy-700 transition-all flex items-center justify-between group"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{item.docType || 'Document'}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{new Date(item.createdAt).toLocaleDateString('en-IN')}</p>
                  <span className={`text-xs font-medium ${uc.text}`}>{uc.label}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-saffron-400 transition-colors flex-shrink-0" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
