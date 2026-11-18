// Luyện phát âm: trình duyệt nhận dạng giọng (Web Speech API, Chrome/Edge), app chấm và bắt lỗi âm cuối -s / -ed.
// Nói thiếu âm cuối -> BẮT BUỘC xem bài âm cuối rồi nói lại từ đó cho tới khi đúng (cho bỏ qua sau 3 lần).
import { useMemo, useRef, useState } from 'react';
import { speak } from '../../utils/tts';
import { judge, endingLesson } from './pronunciation';
import { ModeShell, SpeakButton, RoundSummary } from '../practice/ModeShell.jsx';
import { PRIMARY_BTN, SECONDARY_BTN } from '../practice/modeStyles.js';

const ROUND = 8;
const Recognition = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;

/** Ưu tiên từ có đuôi -s/-ed (lỗi hay gặp nhất), rồi thêm từ khác cho đủ lượt. */
function pickWords(words) {
  const usable = words.filter((w) => /^[a-z]+$/i.test(w.word || ''));
  const withEnding = usable.filter((w) => endingLesson(w.word));
  const rest = usable.filter((w) => !endingLesson(w.word));
  const mix = [...withEnding.sort(() => Math.random() - 0.5).slice(0, 4), ...rest.sort(() => Math.random() - 0.5)];
  return mix.slice(0, ROUND);
}

export default function SpeakMode({ words, onExit }) {
  const list = useMemo(() => pickWords(words), [words]);
  const [idx, setIdx] = useState(0);
  const [listening, setListening] = useState(false);
  const [result, setResult] = useState(null);        // { ok, issue, heard }
  const [lesson, setLesson] = useState(null);        // bài âm cuối đang bắt học
  const [tries, setTries] = useState(0);
  const [score, setScore] = useState(0);
  const [error, setError] = useState('');
  const recRef = useRef(null);
  const word = list[idx];

  if (!Recognition) {
    return (
      <ModeShell title="Phát âm" icon="🎤" onExit={onExit}>
        <p style={{ color: '#dde2e5' }}>Trình duyệt này chưa hỗ trợ nhận dạng giọng nói. Hãy mở Learn Today bằng <b>Chrome</b> hoặc <b>Edge</b> (máy tính hoặc Android) để luyện phát âm.</p>
      </ModeShell>
    );
  }
  if (!word) {
    return (
      <ModeShell title="Phát âm" icon="🎤" onExit={onExit}>
        <RoundSummary correct={score} total={list.length} extra="Tính là đúng khi nói đúng ngay lần đầu." onAgain={() => { setIdx(0); setScore(0); setResult(null); setTries(0); }} onExit={onExit} />
      </ModeShell>
    );
  }

  const listen = () => {
    setError('');
    setResult(null);
    const rec = new Recognition();
    rec.lang = 'en-US';
    rec.maxAlternatives = 5;
    rec.interimResults = false;
    rec.onresult = (e) => {
      const alts = Array.from(e.results[0] || []).map((a) => a.transcript);
      const r = judge(word.word, alts);
      setResult(r);
      setTries((t) => t + 1);
      if (r.ok && tries === 0 && !lesson) setScore((s) => s + 1);
      if (!r.ok && r.issue) setLesson(endingLesson(word.word));
    };
    rec.onerror = (e) => setError(e.error === 'not-allowed' ? 'Bạn cần cho phép dùng micro để luyện phát âm.' : e.error === 'no-speech' ? 'Không nghe thấy gì, thử nói to và rõ hơn.' : 'Không nhận dạng được, thử lại nhé.');
    rec.onend = () => setListening(false);
    recRef.current = rec;
    setListening(true);
    rec.start();
  };
  const next = () => { setIdx((i) => i + 1); setResult(null); setLesson(null); setTries(0); setError(''); };
  const mustRetry = lesson && !(result?.ok);

  return (
    <ModeShell title="Phát âm" icon="🎤" progress={`${idx + 1}/${list.length}`} onExit={onExit}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 36, color: '#f1f5f9' }}>{word.word}</div>
        {word.phonetic && <div style={{ color: '#a2acb3', fontFamily: '"Noto Sans", "Segoe UI", sans-serif' }}>{word.phonetic}</div>}
        <div style={{ color: '#a2acb3', fontSize: 14, margin: '4px 0 14px' }}>{word.meaning}</div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <SpeakButton text={word.word} label="Nghe mẫu" />
          <button type="button" onClick={listen} disabled={listening} style={{ ...PRIMARY_BTN, opacity: listening ? 0.7 : 1 }}>
            {listening ? '🎙️ Đang nghe…' : lesson ? '🎤 Nói lại' : '🎤 Bấm rồi nói'}
          </button>
        </div>
      </div>

      {error && <p style={{ color: '#fca5a5', textAlign: 'center' }}>{error}</p>}

      {result && (
        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <p style={{ margin: 0, color: result.ok ? '#86efac' : '#fca5a5', fontWeight: 700 }}>
            {result.ok ? '✓ Chuẩn rồi!' : result.issue ? '✗ Bạn nuốt mất âm cuối' : '✗ Chưa đúng'}
          </p>
          <p style={{ color: '#a2acb3', fontSize: 13, margin: '4px 0 0' }}>Máy nghe được: "{result.heard || '…'}"</p>
        </div>
      )}

      {lesson && (
        <div style={{ marginTop: 16, padding: 16, borderRadius: 14, background: 'rgba(250,204,21,0.08)', border: '1px solid rgba(250,204,21,0.35)' }}>
          <div style={{ fontWeight: 800, color: '#fde68a', marginBottom: 6 }}>📘 Bài nhanh: âm cuối {lesson.ending} trong "{word.word}" đọc là {lesson.sound}</div>
          <p style={{ color: '#dde2e5', fontSize: 14, margin: '0 0 10px' }}>{lesson.rule}</p>
          <button type="button" style={{ ...SECONDARY_BTN, padding: '8px 14px', fontSize: 13 }} onClick={() => speak(word.word)}>🔊 Nghe lại thật chậm âm cuối</button>
          <p style={{ color: '#a2acb3', fontSize: 13, margin: '10px 0 0' }}>Nói lại "{word.word}" cho đúng để qua câu.</p>
        </div>
      )}

      <div style={{ marginTop: 18, display: 'flex', gap: 10, justifyContent: 'center' }}>
        {result && !mustRetry && <button style={PRIMARY_BTN} onClick={next}>Tiếp →</button>}
        {(result && !result.ok && !lesson) && <button style={SECONDARY_BTN} onClick={next}>Bỏ qua</button>}
        {mustRetry && tries >= 3 && <button style={SECONDARY_BTN} onClick={next}>Bỏ qua (đã thử 3 lần)</button>}
      </div>
    </ModeShell>
  );
}
