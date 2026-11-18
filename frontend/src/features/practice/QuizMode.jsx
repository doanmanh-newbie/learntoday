import { useState } from 'react';
import { ModeShell, RoundSummary, SpeakButton } from './ModeShell.jsx';
import { PRIMARY_BTN } from './modeStyles.js';
import { buildQuiz, scoreQuiz, saveBestIfBetter } from './practiceLogic';
import { sameText } from '../learning/quizChoices';
import { posLabelVi } from '../../api/adapters';

const QUESTION_LABEL = {
  meaning: 'Nghĩa của từ này là gì?',
  word: 'Từ tiếng Anh nào có nghĩa này?',
  blank: 'Điền từ còn thiếu vào câu',
  listen: 'Nghe và chọn nghĩa đúng',
};

/**
 * Props tùy chọn để nhúng vào chỗ khác (vd. "ôn nhanh từ cũ" trong buổi học): `count` số câu, `kinds` các dạng câu,
 * `title`, `onFinish(correct, total)` - nếu có thì KHÔNG hiện màn kết quả riêng mà báo ngay khi trả lời xong câu cuối.
 */
export default function QuizMode({ words, onExit, count = 10, kinds, title = 'Trắc nghiệm', onFinish }) {
  const [qs, setQs] = useState(() => buildQuiz(words, count, Math.random, kinds));
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [record, setRecord] = useState(false);

  const restart = () => { setQs(buildQuiz(words, count, Math.random, kinds)); setI(0); setPicked(null); setAnswers([]); setRecord(false); };

  if (i >= qs.length) {
    const correct = scoreQuiz(answers);
    return <ModeShell title="Trắc nghiệm" icon="⚡" onExit={onExit}>
      <RoundSummary correct={correct} total={qs.length} record={record} onAgain={restart} onExit={onExit} />
    </ModeShell>;
  }
  const q = qs[i];
  const answered = picked !== null;
  const choose = (c) => { if (!answered) { setPicked(c); setAnswers((a) => [...a, sameText(c, q.answer)]); } };
  const next = () => {
    if (i + 1 >= qs.length) {
      if (onFinish) { onFinish(scoreQuiz(answers), qs.length); return; }
      setRecord(saveBestIfBetter('quiz', scoreQuiz(answers)));
    }
    setPicked(null); setI((x) => x + 1);
  };

  return (
    <ModeShell title={title} icon="⚡" progress={`${i + 1}/${qs.length}`} onExit={onExit}>
      <p style={{ color: '#a2acb3', fontSize: 13, margin: 0 }}>{QUESTION_LABEL[q.kind]}</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '8px 0 16px', flexWrap: 'wrap' }}>
        {q.kind === 'listen'
          ? <SpeakButton key={q.id} text={q.prompt} label="Nghe từ" autoPlay />
          : <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: q.kind === 'blank' ? 22 : 28, fontWeight: 800, color: '#f1f5f9', lineHeight: 1.35 }}>{q.prompt}</div>}
        {q.kind === 'meaning' && <SpeakButton text={q.prompt} />}
      </div>
      {q.kind !== 'listen' && <p style={{ margin: '-8px 0 12px', fontSize: 13, color: '#5eead4', fontStyle: 'italic' }}>{posLabelVi(q.word.word_type)}</p>}
      {q.kind === 'blank' && q.hint && <p style={{ color: '#a2acb3', fontSize: 14, margin: '-6px 0 14px' }}>Gợi ý nghĩa: <b style={{ color: '#99f6e4' }}>{q.hint}</b></p>}
      <div style={{ display: 'grid', gap: 10 }}>
        {q.choices.map((c) => {
          const right = answered && sameText(c, q.answer);
          const wrong = answered && c === picked && !right;
          return (
            <button key={c} type="button" onClick={() => choose(c)} disabled={answered && !right && !wrong}
              style={{ textAlign: 'left', padding: '13px 16px', borderRadius: 12, cursor: answered ? 'default' : 'pointer', fontSize: 15,
                color: '#e9edef', background: right ? 'rgba(134,162,77,0.18)' : wrong ? 'rgba(248,113,113,0.15)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${right ? 'rgba(134,162,77,0.6)' : wrong ? 'rgba(248,113,113,0.5)' : 'rgba(255,255,255,0.1)'}` }}>
              {c}
            </button>
          );
        })}
      </div>
      {answered && <div style={{ marginTop: 16, textAlign: 'right' }}><button style={PRIMARY_BTN} onClick={next}>{i + 1 >= qs.length ? (onFinish ? 'Tiếp tục học →' : 'Xem kết quả') : 'Câu tiếp →'}</button></div>}
    </ModeShell>
  );
}
