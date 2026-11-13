// Vì sao quên & cách Learn Today giải quyết. Đồ thị là hình minh hoạ NGUYÊN LÝ (không phải số liệu đo).
import Section from './Section';
import { IconAlert, IconRepeat, IconCheck } from '../../brand/icons';

function CurveIllustration() {
  return (
    <svg viewBox="0 0 420 220" className="w-full" role="img" aria-label="Minh hoạ: không ôn thì trí nhớ giảm nhanh, ôn đúng lúc thì trí nhớ được giữ cao">
      {[40, 100, 160].map((y) => <line key={y} x1="30" x2="400" y1={y} y2={y} stroke="#2b3238" strokeWidth="1" />)}
      <line x1="30" y1="190" x2="400" y2="190" stroke="#3d474e" strokeWidth="1.5" />
      <line x1="30" y1="20" x2="30" y2="190" stroke="#3d474e" strokeWidth="1.5" />
      {/* không ôn: giảm dần (đỏ) */}
      <path d="M30 40 C 80 110, 130 150, 400 176" fill="none" stroke="#f87171" strokeWidth="3" strokeLinecap="round" />
      {/* có ôn: răng cưa giữ cao (xanh ngọc) */}
      <path d="M30 40 C 60 80, 80 90, 100 100 L100 42 C 135 82, 160 92, 190 104 L190 46 C 235 80, 270 88, 310 100 L310 50 C 350 78, 380 84, 400 88" fill="none" stroke="#2dd4bf" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {[100, 190, 310].map((x) => <circle key={x} cx={x} cy={44} r="5" fill="#a3bd6a" stroke="#161a1d" strokeWidth="2" />)}
      <text x="36" y="14" fill="#848f97" fontSize="11">Trí nhớ</text>
      <text x="360" y="208" fill="#848f97" fontSize="11">Thời gian</text>
      <text x="212" y="160" fill="#f87171" fontSize="12" fontWeight="600">Không ôn lại</text>
      <text x="236" y="66" fill="#5eead4" fontSize="12" fontWeight="600">Ôn đúng lúc (●)</text>
    </svg>
  );
}

export default function ForgettingProblemSolutionSection() {
  return (
    <Section
      tone="surface"
      eyebrow="Vấn đề"
      title="Học xong là quên? Đó là chuyện bình thường."
      subtitle="Não bộ quên nhanh những gì không được nhắc lại. Cách chữa không phải là học nhiều hơn, mà là ôn đúng thời điểm."
    >
      <div className="grid items-stretch gap-6 lg:grid-cols-2">
        <article className="rounded-2xl border border-red-500/25 bg-bg p-7">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/15 text-red-300"><IconAlert size={20} /></span>
            <h3 className="font-display text-xl font-bold text-ink">Cách học thường gặp</h3>
          </div>
          <ul className="space-y-3 text-ink-muted">
            <li className="flex gap-3"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />Học dồn một lần rồi ít khi mở lại.</li>
            <li className="flex gap-3"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />Không biết từ nào sắp quên, từ nào đã chắc.</li>
            <li className="flex gap-3"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />Gặp lại từ cũ thì như từ mới hoàn toàn.</li>
          </ul>
        </article>

        <article className="rounded-2xl border border-brand-500/30 bg-bg p-7">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/15 text-brand-300"><IconRepeat size={20} /></span>
            <h3 className="font-display text-xl font-bold text-ink">Cách Learn Today làm</h3>
          </div>
          <ul className="space-y-3 text-ink-muted">
            <li className="flex gap-3"><IconCheck size={18} className="mt-1 shrink-0 text-moss-400" />Mỗi từ có cấp độ riêng, lên cấp khi bạn nhớ đúng.</li>
            <li className="flex gap-3"><IconCheck size={18} className="mt-1 shrink-0 text-moss-400" />Hệ thống tự tính ngày ôn kế tiếp cho từng từ.</li>
            <li className="flex gap-3"><IconCheck size={18} className="mt-1 shrink-0 text-moss-400" />Sai nhiều lần? Bạn chọn lùi cấp, quay về cấp 1 hoặc bỏ qua.</li>
          </ul>
        </article>
      </div>

      <div className="mx-auto mt-10 max-w-xl rounded-2xl border border-line bg-bg p-5">
        <CurveIllustration />
        <p className="mt-2 text-center text-xs text-ink-subtle">Hình minh hoạ nguyên lý ôn tập ngắt quãng</p>
      </div>
    </Section>
  );
}
