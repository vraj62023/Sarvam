import { useState } from 'react';
import { Volume2, ChevronDown, ChevronUp, CheckSquare, AlertTriangle, ArrowRight, Calendar, MessageSquare, Send, Loader2 } from 'lucide-react';
import { URGENCY_COLORS, LANGUAGES } from '../constants';
import { getTTS, playBase64Audio, askQuestion } from '../api';

function SpeakButton({ text, lang, size = 'sm' }) {
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [audio, setAudio] = useState(null);

  const handleSpeak = async () => {
    if (playing && audio) {
      audio.pause();
      audio.currentTime = 0;
      setPlaying(false);
      return;
    }
    try {
      setLoading(true);
      const { audio: b64, format } = await getTTS(text, lang);
      const a = playBase64Audio(b64, format);
      setAudio(a);
      setPlaying(true);
      a.onended = () => setPlaying(false);
    } catch (e) {
      console.error('TTS error:', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleSpeak}
      title={playing ? 'Stop' : 'Listen'}
      className={`inline-flex items-center justify-center rounded-full transition-all ${
        size === 'sm' ? 'w-8 h-8' : 'w-10 h-10'
      } ${playing ? 'bg-saffron-500 text-white' : 'bg-navy-700 text-saffron-400 hover:bg-saffron-500/20'}`}
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 spin" />
      ) : (
        <Volume2 className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
      )}
    </button>
  );
}

function AskBox({ analysisId, lang }) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAsk = async () => {
    if (!question.trim()) return;
    try {
      setLoading(true);
      setError('');
      const res = await askQuestion(analysisId, question.trim(), lang);
      setAnswer(res.answer);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-5 mt-4">
      <h3 className="text-slate-300 font-semibold mb-3 flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-saffron-400" /> Ask about this document
      </h3>
      <div className="flex gap-2">
        <input
          value={question}
          onChange={e => setQuestion(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAsk()}
          placeholder="e.g. What is the deadline to pay rent?"
          className="flex-1 bg-navy-900 border border-navy-600 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-saffron-500 placeholder:text-slate-600"
        />
        <button
          onClick={handleAsk}
          disabled={loading || !question.trim()}
          className="btn-primary px-4 py-2.5 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
      {error && <p className="text-red-400 text-sm mt-2">⚠️ {error}</p>}
      {answer && (
        <div className="mt-3 bg-saffron-500/10 border border-saffron-500/30 rounded-xl p-4">
          <p className="text-slate-200 text-sm leading-relaxed">{answer}</p>
          <div className="mt-2 flex justify-end">
            <SpeakButton text={answer} lang={lang} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function ResultPage({ data, lang, onBack }) {
  const [showOriginal, setShowOriginal] = useState(false);
  const [allPlaying, setAllPlaying] = useState(false);
  const [allAudio, setAllAudio] = useState(null);

  const result = data?.translated || data?.result || {};
  const urgency = result?.urgency || data?.urgency || 'medium';
  const uc = URGENCY_COLORS[urgency] || URGENCY_COLORS.medium;
  const langName = LANGUAGES.find(l => l.code === lang)?.native || 'English';

  const allText = [
    result.summary,
    ...(result.whatYouMustDo || []),
    ...(result.deadlines || []).map(d => `${d.date}: ${d.what}`),
    result.ifYouIgnore,
    ...(result.nextSteps || []),
  ].filter(Boolean).join('. ');

  const handleListenAll = async () => {
    if (allPlaying && allAudio) {
      allAudio.pause();
      setAllPlaying(false);
      return;
    }
    try {
      const { audio: b64, format } = await getTTS(allText.slice(0, 2400), lang);
      const a = playBase64Audio(b64, format);
      setAllAudio(a);
      setAllPlaying(true);
      a.onended = () => setAllPlaying(false);
    } catch (e) {
      console.error('Listen all error:', e.message);
    }
  };

  return (
    <div className="fade-in max-w-2xl mx-auto px-4 py-6">
      {/* Nav */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="btn-secondary text-sm py-2 px-4">
          ← Back
        </button>
        <div className={`px-3 py-1.5 rounded-full text-xs font-bold border ${uc.bg} ${uc.text} ${uc.border}`}>
          {uc.label} URGENCY
        </div>
      </div>

      {/* Title */}
      <div className="card p-5 mb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-slate-400 text-xs mb-1">Document Type</p>
            <h2 className="text-xl font-bold text-white">{result.docType || 'Legal Document'}</h2>
            <p className="text-slate-400 text-xs mt-1">Language: {langName}</p>
          </div>
          <SpeakButton text={`${result.docType}. ${result.summary}`} lang={lang} size="lg" />
        </div>
      </div>

      {/* Listen All */}
      <button
        onClick={handleListenAll}
        className={`w-full mb-4 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all ${
          allPlaying ? 'bg-saffron-600 text-white' : 'bg-saffron-500/10 border border-saffron-500/40 text-saffron-400 hover:bg-saffron-500/20'
        }`}
      >
        <Volume2 className="w-5 h-5" />
        {allPlaying ? '⏸ Pause' : '▶ Listen to Everything'}
      </button>

      {/* Summary */}
      <div className="card p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-white flex items-center gap-2">
            📄 What is this?
          </h3>
          <SpeakButton text={result.summary} lang={lang} />
        </div>
        <p className="text-slate-300 text-sm leading-relaxed">{result.summary}</p>
      </div>

      {/* What you must do */}
      {result.whatYouMustDo?.length > 0 && (
        <div className="card p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-saffron-400" /> What you must do
            </h3>
            <SpeakButton text={result.whatYouMustDo.join('. ')} lang={lang} />
          </div>
          <ul className="space-y-2">
            {result.whatYouMustDo.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                <span className="w-5 h-5 rounded-full bg-saffron-500/20 text-saffron-400 text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">{i+1}</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Deadlines */}
      {result.deadlines?.length > 0 && (
        <div className="card p-5 mb-4 border-red-500/30">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-red-400 flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Deadlines
            </h3>
            <SpeakButton text={result.deadlines.map(d => `${d.date}: ${d.what}`).join('. ')} lang={lang} />
          </div>
          <div className="space-y-2">
            {result.deadlines.map((d, i) => (
              <div key={i} className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                <p className="text-red-400 font-bold text-sm">{d.date}</p>
                <p className="text-slate-300 text-sm">{d.what}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* If you ignore */}
      {result.ifYouIgnore && (
        <div className="card p-5 mb-4 border-amber-500/30">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-amber-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> If you ignore this
            </h3>
            <SpeakButton text={result.ifYouIgnore} lang={lang} />
          </div>
          <p className="text-slate-300 text-sm leading-relaxed">{result.ifYouIgnore}</p>
        </div>
      )}

      {/* Next Steps */}
      {result.nextSteps?.length > 0 && (
        <div className="card p-5 mb-4 border-green-500/20">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-green-400 flex items-center gap-2">
              <ArrowRight className="w-4 h-4" /> Next steps
            </h3>
            <SpeakButton text={result.nextSteps.join('. ')} lang={lang} />
          </div>
          <ol className="space-y-2">
            {result.nextSteps.map((step, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                <ArrowRight className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                {step}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Ask box */}
      {data?._id && <AskBox analysisId={data._id} lang={lang} />}

      {/* Original text */}
      <div className="card mb-4">
        <button
          onClick={() => setShowOriginal(!showOriginal)}
          className="w-full p-4 flex items-center justify-between text-slate-400 hover:text-slate-200 transition-colors"
        >
          <span className="text-sm font-medium">Show original text</span>
          {showOriginal ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {showOriginal && (
          <div className="px-4 pb-4">
            <pre className="text-slate-500 text-xs whitespace-pre-wrap leading-relaxed border-t border-navy-700 pt-3">
              {data?.original || 'No original text available'}
            </pre>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center py-4 border-t border-navy-700">
        <p className="text-slate-600 text-xs">⚖️ Not legal advice. Free legal aid: <strong className="text-slate-500">NALSA 15100</strong></p>
      </div>
    </div>
  );
}
