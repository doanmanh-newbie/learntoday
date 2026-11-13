// Cách hoạt động: các bước + thang 6 cấp độ ôn tập (khớp constants/srs.js).
import Section from './Section';

const STEPS = [
  ['1', 'Học 5 từ mới', 'Xem từ, nghe phát âm rồi gõ lại từ theo nghĩa tiếng Việt.'],
  ['2', 'Làm bài củng cố', 'Trắc nghiệm, điền từ và ghép từ — sai thì làm lại cho đến khi đúng.'],
  ['3', 'Hệ thống lên lịch', 'Từ vào cấp 1 và được hẹn ngày ôn kế tiếp.'],
  ['4', 'Ôn đúng lúc', 'Nhớ đúng thì lên cấp, càng lên cấp càng ôn thưa.'],
];

// khớp SRS_LABELS / SRS_INTERVAL_LABEL trong constants/srs.js
const LEVELS = [
  ['Cấp 1', 'Mới học', '20 phút'],
  ['Cấp 2', 'Biết', '10 giờ'],
  ['Cấp 3', 'Gần thuộc', '1 ngày'],
  ['Cấp 4', 'Đã thuộc', '3 ngày'],
  ['Cấp 5', 'Nhớ dai', '7 ngày'],
  ['Cấp 6', 'Không quên', '21 ngày'],
];
const LEVEL_STYLE = [
  'border-line bg-surface-2 text-ink', 'border-line bg-surface-2 text-ink',
  'border-brand-500/40 bg-brand-500/10 text-brand-200', 'border-brand-500/40 bg-brand-500/15 text-brand-200',
  'border-moss-500/45 bg-moss-500/15 text-moss-200', 'border-moss-500/60 bg-moss-500/25 text-moss-200',
];

export default function SpacedRepetitionProcessSection() {
  return (
    <Section
      id="cach-hoat-dong"
      tone="surface"
      eyebrow="Cách hoạt động"
      title="Học một lần, ôn đúng lúc, nhớ thật lâu"
      subtitle="Vòng lặp đơn giản: học, củng cố, được nhắc lại khi sắp quên."
    >
      <ol className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {STEPS.map(([n, title, text]) => (
          <li key={n} className="relative rounded-2xl border border-line bg-bg p-6">
            <span className="mb-4 flex h-9 w-9 items-center justify-center rounded-full bg-brand-700 font-display text-base font-extrabold text-white">{n}</span>
            <h3 className="font-display text-lg font-bold text-ink">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">{text}</p>
          </li>
        ))}
      </ol>

      <div className="mt-12">
        <h3 className="mb-5 text-center font-display text-xl font-bold text-ink">Sáu cấp độ ôn tập</h3>
        <ol className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {LEVELS.map(([lv, name, gap], i) => (
            <li key={lv} className={`rounded-xl border p-4 text-center ${LEVEL_STYLE[i]}`}>
              <p className="text-xs font-semibold uppercase tracking-wider opacity-80">{lv}</p>
              <p className="mt-1 font-display text-base font-bold">{name}</p>
              <p className="mt-2 text-xs opacity-80">ôn lại sau {gap}</p>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  );
}
