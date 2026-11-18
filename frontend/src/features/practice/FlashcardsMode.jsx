import { useState } from 'react';
import { ModeShell, RoundSummary, SpeakButton } from './ModeShell.jsx';
import { PRIMARY_BTN, SECONDARY_BTN } from './modeStyles.js';
import { pickWords } from './practiceLogic';
import { posLabelVi } from '../../api/adapters';
import WordPicture from '../../components/word/WordPicture.jsx';

const DECK = 20;

export default function FlashcardsMode({ words, onExit }) {
  const [deck, setDeck] = useState(() => pickWords(words, DECK));
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState(0);

  const restart = () => { setDeck(pickWords(words, DECK)); setI(0); setFlipped(false); setKnown(0); };
  if (i >= deck.length) {
    return <ModeShell title="Thẻ nhanh" icon="🃏" onExit={onExit}>
      <RoundSummary correct={known} total={deck.length} extra="Số thẻ bạn tự đánh giá là đã nhớ" onAgain={restart} onExit={onExit} />
    </ModeShell>;
  }
  const w = deck[i];
  const next = (isKnown) => { if (isKnown) setKnown((k) => k + 1); setFlipped(false); setI((x) => x + 1); };

  return (
    <ModeShell title="Thẻ nhanh" icon="🃏" progress={`${i + 1}/${deck.length}`} onExit={onExit}>
      <button type="button" onClick={() => setFlipped((f) => !f)} aria-label="Lật thẻ"
        style={{ width: '100%', minHeight: 200, borderRadius: 16, cursor: 'pointer', padding: 20, border: '1px solid rgba(45,212,191,0.25)',
                 background: 'rgba(45,212,191,0.05)', color: '#f1f5f9', fontFamily: 'Outfit, sans-serif' }}>
        {!flipped ? (
          <>
            <div style={{ display: 'grid', placeItems: 'center', marginBottom: 10 }}><WordPicture word={w} size={84} radius={20} /></div>
            <div style={{ fontSize: 34, fontWeight: 800 }}>{w.word}</div>
            <div style={{ color: '#5eead4', marginTop: 6, fontStyle: 'italic', fontSize: 14 }}>{posLabelVi(w.word_type)}</div>
            {w.phonetic && <div style={{ color: '#a2acb3', marginTop: 4 }}>{w.phonetic}</div>}
            <div style={{ color: '#6b7780', fontSize: 12, marginTop: 14 }}>Chạm để xem nghĩa</div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 26, fontWeight: 700, color: '#99f6e4' }}>{w.meaning}</div>
            {w.example && <div style={{ color: '#a2acb3', fontSize: 14, marginTop: 12, fontFamily: 'Inter, sans-serif' }}>{w.example}</div>}
          </>
        )}
      </button>
      <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
        <SpeakButton text={w.word} />
        {flipped && (<>
          <button style={SECONDARY_BTN} onClick={() => next(false)}>😕 Chưa nhớ</button>
          <button style={PRIMARY_BTN} onClick={() => next(true)}>✅ Đã nhớ</button>
        </>)}
      </div>
    </ModeShell>
  );
}
