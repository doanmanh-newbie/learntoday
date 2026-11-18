import { useEffect, useRef, useState } from 'react';
import { ModeShell, RoundSummary } from './ModeShell.jsx';
import { buildMatchRound, isMatch, formatSeconds, saveBestIfBetter, readBest } from './practiceLogic';

const nowMs = () => Date.now();   // gọi trong trình xử lý sự kiện (không phải lúc render)

export default function MatchMode({ words, onExit }) {
  const [round, setRound] = useState(() => buildMatchRound(words, 6));
  const [left, setLeft] = useState(null);
  const [done, setDone] = useState([]);
  const [wrong, setWrong] = useState(0);
  const [wrongPair, setWrongPair] = useState(null);
  const [secs, setSecs] = useState(0);
  const [record, setRecord] = useState(false);
  const startRef = useRef(null);
  const finished = done.length === round.left.length;

  useEffect(() => { startRef.current = Date.now(); }, [round]);
  useEffect(() => {
    if (finished) return undefined;
    const id = setInterval(() => setSecs(Math.floor((Date.now() - (startRef.current || Date.now())) / 1000)), 500);
    return () => clearInterval(id);
  }, [finished, round]);

  const restart = () => { setRound(buildMatchRound(words, 6)); setLeft(null); setDone([]); setWrong(0); setSecs(0); setRecord(false); };

  const pickRight = (rid) => {
    if (left == null) return;
    if (isMatch(left, rid)) {
      const nd = [...done, rid];
      setDone(nd); setLeft(null);
      if (nd.length === round.left.length) {
        const t = Math.max(1, Math.floor((nowMs() - startRef.current) / 1000));
        setSecs(t);
        // điểm = số giây còn lại trong 120s trừ phạt lỗi (cao hơn là tốt hơn)
        setRecord(saveBestIfBetter('match', Math.max(1, 120 - t - wrong * 5)));
      }
    } else {
      setWrong((w) => w + 1); setWrongPair(rid); setTimeout(() => setWrongPair(null), 500); setLeft(null);
    }
  };

  if (finished) {
    return <ModeShell title="Ghép cặp" icon="🧩" onExit={onExit}>
      <RoundSummary correct={round.left.length} total={round.left.length}
        extra={`Thời gian ${formatSeconds(secs)} · ${wrong} lần nối sai${readBest('match') ? ` · điểm tốt nhất ${readBest('match')}` : ''}`}
        record={record} onAgain={restart} onExit={onExit} />
    </ModeShell>;
  }
  const cell = (active, ok, bad) => ({ padding: '12px 14px', borderRadius: 12, fontSize: 14, textAlign: 'left', cursor: ok ? 'default' : 'pointer', color: '#e9edef',
    opacity: ok ? 0.35 : 1, background: bad ? 'rgba(248,113,113,0.18)' : active ? 'rgba(45,212,191,0.18)' : 'rgba(255,255,255,0.04)',
    border: `1px solid ${bad ? 'rgba(248,113,113,0.5)' : active ? 'rgba(45,212,191,0.6)' : 'rgba(255,255,255,0.1)'}` });

  return (
    <ModeShell title="Ghép cặp" icon="🧩" progress={`⏱ ${formatSeconds(secs)} · ${done.length}/${round.left.length}`} onExit={onExit}>
      <p style={{ color: '#a2acb3', fontSize: 13, marginTop: 0 }}>Chọn một từ bên trái, rồi chọn nghĩa tương ứng bên phải.</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div style={{ display: 'grid', gap: 8 }}>
          {round.left.map((l) => (
            <button key={l.id} type="button" disabled={done.includes(l.id)} onClick={() => setLeft(l.id)} style={cell(left === l.id, done.includes(l.id))}>{l.text}</button>
          ))}
        </div>
        <div style={{ display: 'grid', gap: 8 }}>
          {round.right.map((r) => (
            <button key={r.id} type="button" disabled={done.includes(r.id)} onClick={() => pickRight(r.id)} style={cell(false, done.includes(r.id), wrongPair === r.id)}>{r.text}</button>
          ))}
        </div>
      </div>
    </ModeShell>
  );
}
