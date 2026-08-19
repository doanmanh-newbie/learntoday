// Topics.jsx — Carousel "coverflow" chủ đề từ vựng (port từ thiết kế Figma
// "TopicCardsRedesign", Variant A - chỉ giữ carousel, bỏ phần upload ảnh).
import { useEffect, useRef, useState } from "react";

const vocabularyTopics = [
  { title: "Gia đình", wordCount: "120 từ", image: "https://c.animaapp.com/zdBS24aH/img/image-container@2x.png" },
  { title: "Du lịch", wordCount: "150 từ", image: "https://c.animaapp.com/zdBS24aH/img/image-container-1@2x.png" },
  { title: "Ẩm thực", wordCount: "180 từ", image: "https://c.animaapp.com/zdBS24aH/img/image-container-2@2x.png" },
  { title: "IELTS", wordCount: "800 từ", image: "https://c.animaapp.com/zdBS24aH/img/image-container-3@2x.png" },
  { title: "TOEIC", wordCount: "650 từ", image: "https://c.animaapp.com/zdBS24aH/img/image-container-4@2x.png" },
];

const TOTAL = vocabularyTopics.length;
const EASE = "cubic-bezier(0.37, 0, 0.63, 1)";

/** Vị trí tương đối của thẻ so với thẻ đang ở giữa (0 = giữa, -1/1 = 2 bên...) */
function getRelPos(index, activeIndex) {
  return ((index - activeIndex + TOTAL + 2) % TOTAL) - 2;
}

function carouselProps(relPos) {
  const abs = Math.abs(relPos);
  return {
    scale: relPos === 0 ? 1.15 : abs === 1 ? 0.9 : 0.8,
    opacity: relPos === 0 ? 1 : abs === 1 ? 0.8 : 0.5,
    zIndex: relPos === 0 ? 10 : abs === 1 ? 5 : 1,
  };
}

function cardShadow(isCenter, isHovered) {
  if (isCenter && isHovered) return "0 24px 64px rgba(15,23,42,0.22), 0 8px 24px rgba(15,23,42,0.14)";
  if (isCenter) return "0 16px 48px rgba(15,23,42,0.16), 0 6px 16px rgba(15,23,42,0.10)";
  if (isHovered) return "0 8px 28px rgba(15,23,42,0.13), 0 2px 8px rgba(15,23,42,0.07)";
  return "0 4px 8px rgba(15,23,42,0.04)";
}

/** Kích thước thẻ/khoảng cách co theo bề rộng màn hình để carousel không vỡ trên mobile. */
function useCarouselSizing() {
  const [size, setSize] = useState({ cardWidth: 232, slotPx: 256, trackHeight: 380 });

  useEffect(() => {
    function computeSize() {
      const width = window.innerWidth;
      if (width < 480) return setSize({ cardWidth: 160, slotPx: 172, trackHeight: 300 });
      if (width < 768) return setSize({ cardWidth: 190, slotPx: 208, trackHeight: 330 });
      return setSize({ cardWidth: 232, slotPx: 256, trackHeight: 380 });
    }
    computeSize();
    window.addEventListener("resize", computeSize);
    return () => window.removeEventListener("resize", computeSize);
  }, []);

  return size;
}

function TopicCard({ topic, relPos, isHovered, cardWidth, slotPx, onEnter, onLeave, onSelect }) {
  const { scale, opacity, zIndex } = carouselProps(relPos);
  const isCenter = relPos === 0;

  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: cardWidth,
        transform: `translate(calc(-50% + ${relPos * slotPx}px), -50%) scale(${scale})`,
        opacity,
        zIndex,
        transition: `transform 400ms ${EASE}, opacity 400ms ${EASE}`,
      }}
    >
      <button
        type="button"
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
        onClick={onSelect}
        aria-label={`Chọn chủ đề ${topic.title}, ${topic.wordCount}`}
        aria-current={isCenter ? "true" : undefined}
        className="block w-full cursor-pointer rounded-2xl text-left"
        style={{
          transform: `translateY(${isHovered ? -8 : 0}px)`,
          transition: "transform 200ms ease, box-shadow 200ms ease",
          boxShadow: cardShadow(isCenter, isHovered),
        }}
      >
        <div className="relative flex w-full flex-col items-start gap-4 rounded-2xl bg-white p-3">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-2xl border border-solid border-slate-200" />
          <div className="relative aspect-square w-full overflow-hidden rounded-[10px]">
            <img alt={topic.title} src={topic.image} className="absolute inset-0 h-full w-full object-cover" />
          </div>
          <div className="flex w-full flex-col gap-1">
            <p className="w-full [font-family:'Lexend_Deca',Helvetica] text-base font-bold text-slate-900">{topic.title}</p>
            <p className="w-full [font-family:'Rethink_Sans',Helvetica] text-[13px] text-slate-600">{topic.wordCount}</p>
          </div>
        </div>
      </button>
    </div>
  );
}

function CarouselNavButton({ direction, onClick }) {
  const isLeft = direction === "left";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={isLeft ? "Chủ đề trước" : "Chủ đề tiếp theo"}
      className={`absolute top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-solid border-slate-200 bg-white shadow-[0_4px_16px_rgba(15,23,42,0.12),0_1px_4px_rgba(15,23,42,0.08)] transition-transform duration-150 ease-out hover:scale-110 hover:shadow-[0_8px_24px_rgba(15,23,42,0.16),0_2px_8px_rgba(15,23,42,0.1)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:h-12 sm:w-12 ${
        isLeft ? "left-1 sm:left-3" : "right-1 sm:right-3"
      }`}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        {isLeft ? <polyline points="15 18 9 12 15 6" /> : <polyline points="9 18 15 12 9 6" />}
      </svg>
    </button>
  );
}

export default function VocabularyTopicLibrarySection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const { cardWidth, slotPx, trackHeight } = useCarouselSizing();

  const sectionRef = useRef(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setIsInView(true);
      return undefined;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const goNext = () => setActiveIndex((prev) => (prev + 1) % TOTAL);
  const goPrev = () => setActiveIndex((prev) => (prev - 1 + TOTAL) % TOTAL);

  return (
    <section className="flex w-full flex-col bg-slate-50 px-6 py-16 sm:px-10 lg:px-20 lg:py-20" aria-labelledby="vocabulary-topic-library-title">
      <header className="flex w-full flex-col items-start gap-4">
        <div className="inline-flex items-start px-3 py-1.5 relative flex-[0_0_auto] bg-indigo-50 rounded-[100px]">
          <p className="relative w-fit mt-[-1.00px] [font-family:'Rethink_Sans',Helvetica] font-bold text-indigo-600 text-xs tracking-[0.14px] leading-[normal]">KHÁM PHÁ GIAO DIỆN MỚI</p>
        </div>
        <h2 id="vocabulary-topic-library-title" className="relative self-stretch [font-family:'Lexend_Deca',Helvetica] font-extrabold text-slate-900 text-4xl tracking-[0] leading-[43.2px]">Thư Viện Chủ Đề Từ Vựng</h2>
        <p className="relative w-full max-w-[800px] [font-family:'Rethink_Sans',Helvetica] font-normal text-slate-600 text-base tracking-[0] leading-[25.6px]">Trải nghiệm tính năng phân loại thông minh, lựa chọn chủ đề bạn muốn học ngay hôm nay.</p>
      </header>

      <div
        className="mt-12 flex w-full flex-col items-start gap-4 transition-all duration-700 ease-out"
        style={{
          opacity: isInView ? 1 : 0,
          transform: isInView ? "translateY(0)" : "translateY(24px)",
        }}
      >
        <div className="inline-flex items-center gap-2 relative flex-[0_0_auto]">
          <span className="text-indigo-600 relative w-fit mt-[-1.00px] [font-family:'Lexend_Deca',Helvetica] font-extrabold text-sm tracking-[0.21px] leading-[normal]">CHỦ ĐỀ NỔI BẬT</span>
          <span className="relative w-fit mt-[-1.00px] [font-family:'Rethink_Sans',Helvetica] font-normal text-slate-400 text-sm tracking-[0] leading-[normal]" aria-hidden="true">•</span>
          <p className="relative w-fit mt-[-1.00px] [font-family:'Rethink_Sans',Helvetica] font-semibold text-slate-600 text-sm tracking-[0] leading-[normal]">Vuốt hoặc bấm mũi tên để xem thêm</p>
        </div>

        <div
          ref={sectionRef}
          className="relative w-full overflow-hidden"
          style={{ height: trackHeight }}
          role="region"
          aria-roledescription="carousel"
          aria-label="Danh sách chủ đề từ vựng"
        >
          {vocabularyTopics.map((topic, index) => (
            <TopicCard
              key={topic.title}
              topic={topic}
              relPos={getRelPos(index, activeIndex)}
              isHovered={hoveredIndex === index}
              cardWidth={cardWidth}
              slotPx={slotPx}
              onEnter={() => setHoveredIndex(index)}
              onLeave={() => setHoveredIndex(null)}
              onSelect={() => setActiveIndex(index)}
            />
          ))}

          <CarouselNavButton direction="left" onClick={goPrev} />
          <CarouselNavButton direction="right" onClick={goNext} />
        </div>

        <div className="flex w-full items-center justify-center gap-2" role="tablist" aria-label="Chọn chủ đề theo trang">
          {vocabularyTopics.map((topic, index) => (
            <button
              key={topic.title}
              type="button"
              role="tab"
              aria-selected={index === activeIndex}
              aria-label={`Xem chủ đề ${topic.title}`}
              onClick={() => setActiveIndex(index)}
              className="h-2 rounded-full transition-all duration-300 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              style={{
                width: index === activeIndex ? 24 : 8,
                backgroundColor: index === activeIndex ? "#4f46e5" : "#cbd5e1",
              }}
            />
          ))}
        </div>
      </div>

      <img className="mt-12 w-full max-h-px object-cover" alt="" aria-hidden="true" src="https://c.animaapp.com/zdBS24aH/img/line.svg" />
    </section>
  );
}
