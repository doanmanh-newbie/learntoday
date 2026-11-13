import { useEffect, useState } from 'react';
import { ModeShell, RoundSummary, SpeakButton, PRIMARY_BTN } from './ModeShell.jsx';
import { pickWords, maskedWord, sameText, scoreQuiz, saveBestIfBetter } from './practiceLogic';
import { speak } from '../../utils/tts';

const ROUND = 8;

export default function ListenMode({ words, onExit }) {
  const [deck, setDeck] = useState(() => pickWords(words, ROUND));
  const [i, setI] = useState(0);
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);   // null | true | false
  const [answers, setAnswers] = useState([]);
  const [record, setRecord] = useState(false);
  const w = deck[i];

  useEffect(() => { if (w) speak(w.word); }, [w]);

  const restart = () => { setDeck(pickWords(words, ROUND)); setI(0); setText(''); setResult(null); setAnswers([]); setRecord(false); };
  if (!w) {
    return <ModeShell title="Nghe & chép" icon="🎧" onExit={onExit}>
      <RoundSummary correct={scoreQuiz(answers)} total={deck.length} record={record} onAgain={restart} onExit={onExit} />
    </ModeShell>;
  }
  const submit = (e) => {
    e.preventDefault();
    if (result !== null || !text.trim()) return;
    const ok = sameText(text, w.word);
    setResult(ok); setAnswers((a) => [...a, ok]);
  };
  const next = () => {
    if (i + 1 >= deck.length) setRecord(saveBestIfBetter('listen', scoreQuiz(answers)));
    setText(''); setResult(null); setI((x) => x + 1);
  };

  return (
    <ModeShell title="Nghe & chép" icon="🎧" progress={`${i + 1}/${deck.length}`} onExit={onExit}>
      <p style={{ color: '#a2acb3', fontSize: 13, margin: 0 }}>Nghe rồi gõ lại từ bạn nghe được.</p>
      <div style={{ margin: '12px 0' }}><SpeakButton text={w.word} label="Nghe lại" /></div>
      <div style={{ color: '#a2acb3', marginBottom: 12 }}>Nghĩa: <b style={{ color: '#f1f5f9' }}>{w.meaning}</b> · gợi ý: <code>{maskedWord(w.word)}</code></div>
      <form onSubmit={submit}>
        <input value={text} onChange={(e) => setText(e.target.value)} disabled={result !== null} autoFocus autoCapitalize="none" autoCorrect="off" spellCheck={false}
          placeholder="Gõ từ tiếng Anh…" aria-label="Từ nghe được"
          style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px', borderRadius: 12, fontSize: 16, color: '#e9edef', background: 'rgba(255,255,255,0.04)',
            border: `1px solid ${result === null ? 'rgba(255,255,255,0.12)' : result ? 'rgba(134,162,77,0.6)' : 'rgba(248,113,113,0.5)'}` }} />
        {result === null
          ? <div style={{ marginTop: 14, textAlign: 'right' }}><button type="submit" style={PRIMARY_BTN} disabled={!text.trim()}>Kiểm tra</button></div>
          : (<div style={{ marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ color: result ? '#a3d977' : '#fca5a5', fontWeight: 700 }}>{result ? '✅ Chính xác!' : `❌ Đáp án: ${w.word}`}</span>
              <button type="button" style={PRIMARY_BTN} onClick={next}>{i + 1 >= deck.length ? 'Xem kết quả' : 'Tiếp →'}</button>
            </div>)}
      </form>
    </ModeShell>
  );
}
