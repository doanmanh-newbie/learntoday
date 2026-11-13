// Tính năng chính - chỉ liệt kê những gì sản phẩm thực sự có.
import Section from './Section';
import { IconBook, IconRepeat, IconLayers, IconSearch, IconVolume, IconChart } from '../../brand/icons';

const FEATURES = [
  { icon: IconBook, title: 'Học theo chủ đề', text: 'Chọn folder, xem danh sách từ rồi bắt đầu học từng lô 5 từ. Tự tạo thư mục riêng cho từ của bạn.', tone: 'brand' },
  { icon: IconRepeat, title: 'Ôn tập ngắt quãng', text: 'Sáu cấp độ với lịch ôn từ 20 phút đến 21 ngày. Số từ ôn mỗi lần do bạn chọn.', tone: 'brand' },
  { icon: IconLayers, title: 'Bốn dạng bài cho mỗi từ', text: 'Gõ chính tả, trắc nghiệm, điền từ vào câu và ghép từ với nghĩa giúp nhớ bằng nhiều cách.', tone: 'moss' },
  { icon: IconSearch, title: 'Từ điển Anh – Việt', text: 'Tra mọi nghĩa của từ kèm phiên âm, ví dụ, đồng/trái nghĩa. Lưu từ vào thư mục chỉ bằng một nút.', tone: 'moss' },
  { icon: IconVolume, title: 'Phát âm Anh – Anh, Anh – Mỹ', text: 'Nghe phát âm tự động sau mỗi lần trả lời và chọn giọng đọc ưa thích trong cài đặt.', tone: 'brand' },
  { icon: IconChart, title: 'Thống kê và chuỗi học', text: 'Theo dõi số từ đã học, độ chính xác, thời gian học và chuỗi ngày học liên tiếp.', tone: 'red' },
];

const TONES = {
  brand: 'border-brand-500/30 bg-brand-500/10 text-brand-300',
  moss: 'border-moss-500/35 bg-moss-500/10 text-moss-300',
  red: 'border-red-500/30 bg-red-500/10 text-red-300',
};

export default function VocabularyLearningFeaturesSection() {
  return (
    <Section
      id="tinh-nang"
      eyebrow="Tính năng"
      title="Mọi thứ bạn cần để nhớ từ vựng"
      subtitle="Từ lúc học từ mới đến khi từ đó thật sự ở lại trong đầu."
    >
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, text, tone }) => (
          <article key={title} className="rounded-2xl border border-line bg-surface p-6 transition hover:border-brand-500/40 hover:bg-surface-2">
            <span className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl border ${TONES[tone]}`}><Icon size={24} /></span>
            <h3 className="font-display text-lg font-bold text-ink">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">{text}</p>
          </article>
        ))}
      </div>
    </Section>
  );
}
