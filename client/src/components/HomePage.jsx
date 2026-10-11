import { useState, useCallback } from 'react';
import { Upload, FileText, ChevronDown, Globe, Sparkles } from 'lucide-react';
import { LANGUAGES, SAMPLE_EVICTION_NOTICE } from '../constants';
import { analyzeText, analyzeFile } from '../api';

const STEPS = ['Reading document', 'Simplifying', 'Translating'];

function LoadingStep({ step, total }) {
  return (
    <div className="flex flex-col items-center gap-6 py-12">
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-4 border-saffron-500/30 border-t-saffron-500 spin" />
        <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-saffron-400" />
      </div>
      <div className="flex flex-col items-center gap-3 w-full max-w-xs">
        {STEPS.map((s, i) => (
          <div key={s} className={`flex items-center gap-3 w-full px-4 py-2 rounded-lg transition-all ${
            i < step ? 'text-green-400' : i === step ? 'text-saffron-400 font-semibold' : 'text-slate-500'
          }`}>
            <span className="text-lg">{i < step ? '✓' : i === step ? '⟳' : '○'}</span>
            <span className="text-sm">{s}</span>
          </div>
        ))}
      </div>
      <p className="text-slate-400 text-sm">This may take 20–40 seconds…</p>
    </div>
  );
}

export default function HomePage({ onResult }) {
  const [tab, setTab] = useState('upload'); // 'upload' | 'paste'
  const [lang, setLang] = useState('hi-IN');
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState(null);
  const [pasteText, setPasteText] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState('');

  const handleFile = useCallback(f => {
    const allowed = ['application/pdf', 'image/png', 'image/jpeg'];
    if (!allowed.some(t => f.type === t) && !/\.(pdf|png|jpg|jpeg)$/i.test(f.name)) {
      setError('Only PDF, PNG, JPG files allowed.');
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError('File must be under 10 MB.');
      return;
    }
    setFile(f);
    setError('');
  }, []);

  const handleDrop = useCallback(e => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const simulate = (ms) => new Promise(r => setTimeout(r, ms));

  const handleSubmit = async () => {
    setError('');
    try {
      setLoading(true);
      setLoadingStep(0);

      let result;
      if (tab === 'paste') {
        if (pasteText.trim().length < 10) { setError('Please enter at least 10 characters.'); setLoading(false); return; }
        await simulate(300);
        setLoadingStep(1);
        result = await analyzeText(pasteText.trim(), lang);
      } else {
        if (!file) { setError('Please select a file.'); setLoading(false); return; }
        setLoadingStep(0);
        result = await analyzeFile(file, lang);
      }

      setLoadingStep(2);
      await simulate(200);
      onResult(result, lang);
    } catch (e) {
      setError(e.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const trySample = () => {
    setTab('paste');
    setPasteText(SAMPLE_EVICTION_NOTICE);
    setError('');
  };

  return (
    <div className="fade-in max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-saffron-500/10 border border-saffron-500/30 rounded-full px-4 py-1.5 mb-4">
          <span className="text-saffron-400 text-sm font-medium">⚖️ Free Legal Literacy Tool</span>
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">
          <span className="text-saffron-400">Kanoon</span>{' '}
          <span className="text-white">Chhota</span>
        </h1>
        <p className="text-slate-400 text-base">कानून छोटा — Legal documents, in your language, in your voice.</p>
      </div>

      {/* Language Selector */}
      <div className="card p-4 mb-4">
        <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2 block flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5" /> Choose your language
        </label>
        <div className="flex flex-wrap gap-2">
          {LANGUAGES.map(l => (
            <button
              key={l.code}
              onClick={() => setLang(l.code)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                lang === l.code
                  ? 'bg-saffron-500 text-white shadow-lg shadow-saffron-500/30'
                  : 'bg-navy-700 text-slate-300 hover:bg-navy-600'
              }`}
            >
              {l.native}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="card overflow-hidden mb-4">
        <div className="flex border-b border-navy-700">
          <button
            onClick={() => setTab('upload')}
            className={`tab-btn flex-1 rounded-none ${tab === 'upload' ? 'bg-saffron-500/10 text-saffron-400 border-b-2 border-saffron-500' : 'text-slate-400 hover:text-slate-200'}`}
          >
            📎 Upload File
          </button>
          <button
            onClick={() => setTab('paste')}
            className={`tab-btn flex-1 rounded-none ${tab === 'paste' ? 'bg-saffron-500/10 text-saffron-400 border-b-2 border-saffron-500' : 'text-slate-400 hover:text-slate-200'}`}
          >
            📝 Paste Text
          </button>
        </div>

        <div className="p-5">
          {loading ? (
            <LoadingStep step={loadingStep} total={STEPS.length} />
          ) : tab === 'upload' ? (
            <div>
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => document.getElementById('file-input').click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  dragOver ? 'border-saffron-400 bg-saffron-500/10' : 'border-navy-600 hover:border-saffron-500/50 hover:bg-saffron-500/5'
                }`}
              >
                <Upload className="w-10 h-10 text-saffron-500 mx-auto mb-3" />
                {file ? (
                  <div>
                    <p className="text-green-400 font-medium">✓ {file.name}</p>
                    <p className="text-slate-500 text-sm mt-1">{(file.size / 1024).toFixed(0)} KB</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-slate-300 font-medium">Drop your document here</p>
                    <p className="text-slate-500 text-sm mt-1">PDF, PNG, JPG · max 10 MB</p>
                  </div>
                )}
                <input
                  id="file-input"
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  className="hidden"
                  onChange={e => e.target.files[0] && handleFile(e.target.files[0])}
                />
              </div>
              {/* Camera capture for mobile */}
              <button
                onClick={() => document.getElementById('camera-input').click()}
                className="mt-3 w-full btn-secondary text-sm"
              >
                📷 Take Photo with Camera
              </button>
              <input
                id="camera-input"
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={e => e.target.files[0] && handleFile(e.target.files[0])}
              />
            </div>
          ) : (
            <div>
              <textarea
                value={pasteText}
                onChange={e => setPasteText(e.target.value)}
                placeholder="Paste your legal document text here…"
                rows={8}
                className="w-full bg-navy-900 border border-navy-600 rounded-xl p-4 text-slate-200 text-sm resize-none focus:outline-none focus:border-saffron-500 placeholder:text-slate-600"
              />
              <p className="text-slate-600 text-xs mt-1 text-right">{pasteText.length} characters</p>
            </div>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/40 rounded-xl p-4 mb-4 text-red-400 text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Actions */}
      {!loading && (
        <div className="flex gap-3">
          <button onClick={trySample} className="btn-secondary flex-1 flex items-center justify-center gap-2">
            <FileText className="w-4 h-4" /> Try Sample
          </button>
          <button onClick={handleSubmit} className="btn-primary flex-2 flex-1 flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4" /> Explain Document
          </button>
        </div>
      )}

      {/* Footer */}
      <p className="text-center text-slate-600 text-xs mt-6">
        ⚖️ Not legal advice. Free legal aid: <strong className="text-slate-500">NALSA 15100</strong>
      </p>
    </div>
  );
}
