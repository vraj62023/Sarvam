import { useState, useCallback } from 'react';
import { Clock, Scale } from 'lucide-react';
import HomePage from './components/HomePage';
import ResultPage from './components/ResultPage';
import HistoryDrawer from './components/HistoryDrawer';
import Toast from './components/Toast';

export default function App() {
  const [page, setPage] = useState('home'); // 'home' | 'result'
  const [result, setResult] = useState(null);
  const [lang, setLang] = useState('hi-IN');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'error') => {
    setToast({ message, type });
  }, []);

  const handleResult = useCallback((data, selectedLang) => {
    setResult(data);
    setLang(selectedLang);
    setPage('result');
  }, []);

  const handleBack = useCallback(() => {
    setPage('home');
    setResult(null);
  }, []);

  const handleHistorySelect = useCallback((data, selectedLang) => {
    setResult(data);
    setLang(selectedLang || 'hi-IN');
    setPage('result');
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-900 via-[#0d1b3e] to-navy-900">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-navy-900/90 backdrop-blur-sm border-b border-navy-700/50">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-saffron-400 font-bold text-lg hover:text-saffron-300 transition-colors"
          >
            <Scale className="w-5 h-5" />
            <span>Kanoon Chhota</span>
          </button>
          <button
            onClick={() => setHistoryOpen(true)}
            className="flex items-center gap-1.5 text-slate-400 hover:text-saffron-400 transition-colors text-sm"
          >
            <Clock className="w-4 h-4" /> History
          </button>
        </div>
      </header>

      {/* Main */}
      <main>
        {page === 'home' ? (
          <HomePage onResult={handleResult} onError={showToast} />
        ) : (
          <ResultPage data={result} lang={lang} onBack={handleBack} onError={showToast} />
        )}
      </main>

      {/* History Drawer */}
      <HistoryDrawer
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        onSelect={handleHistorySelect}
      />

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
