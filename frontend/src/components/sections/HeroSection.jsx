// HeroSection.jsx - Đã sửa hoàn chỉnh
import React from "react";

const heroImageUrl = "https://c.animaapp.com/zdBS24aH/img/hero-graphic.png";
const flashcardPhotoUrl =
  "https://c.animaapp.com/zdBS24aH/img/flashcard-photo@2x.png";
const audioControlsUrl =
  "https://c.animaapp.com/zdBS24aH/img/audio-controls.svg";

export default function VocabularyLearningHeroSection() {
  return (
    <section
      className="relative flex min-h-[560px] w-full items-center gap-8 bg-[linear-gradient(117deg,rgba(49,46,129,0.5)_0%,rgba(79,70,229,0.5)_100%),linear-gradient(0deg,rgba(30,27,75,1)_0%,rgba(30,27,75,1)_100%)] px-6 py-12 sm:px-10 lg:px-20 max-[767px]:h-auto max-[767px]:flex-col max-[767px]:px-6 max-[767px]:py-12"
      aria-labelledby="vocabulary-learning-heading"
    >
      <div className="relative flex flex-1 grow flex-col items-start gap-7 max-[767px]:w-full">
        <div className="relative flex w-full flex-[0_0_auto] flex-col items-start gap-4">
          <h1
            id="vocabulary-learning-heading"
            className="relative mt-[-1.00px] self-stretch [font-family:'Lexend_Deca',Helvetica] text-5xl font-extrabold leading-[55.2px] tracking-[0] text-white max-[767px]:text-4xl max-[767px]:leading-[44px]"
          >
            Học ít hơn, nhớ lâu hơn cùng Learn Today
          </h1>
          <p className="relative self-stretch [font-family:'Rethink_Sans',Helvetica] text-lg font-normal leading-[27px] tracking-[0] text-slate-200">
            Quên ngay nỗi lo học trước quên sau. Ghi nhớ từ vựng lâu dài thông
            qua cơ chế Spaced Repetition thông minh mà không cần học nhồi nhét.
          </p>
        </div>
        <div className="relative flex w-full flex-[0_0_auto] flex-col items-start gap-3">
          <div className="relative inline-flex flex-[0_0_auto] items-center gap-4 max-[479px]:flex-col max-[479px]:items-stretch">
            <a
              href="/learn"
              className="relative inline-flex flex-[0_0_auto] items-center justify-center gap-2 rounded-lg bg-amber-500 px-6 py-3 [font-family:'Rethink_Sans',Helvetica] text-[15px] font-semibold leading-[normal] tracking-[0] text-indigo-950 transition-colors hover:bg-amber-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200 max-[479px]:w-full"
            >
              Bắt đầu học ngay
            </a>
            <a
              href="#how-it-works"
              className="relative inline-flex flex-[0_0_auto] items-start rounded-lg border border-solid border-white px-6 py-3 [font-family:'Rethink_Sans',Helvetica] text-[15px] font-semibold leading-[normal] tracking-[0] text-white transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white max-[479px]:justify-center"
            >
              Xem cách học
            </a>
          </div>
          <p className="relative self-stretch [font-family:'Rethink_Sans',Helvetica] text-sm font-normal leading-[normal] tracking-[0] text-slate-400">
            <span aria-hidden="true">⭐ </span>
            50.000+ người Việt đã học và ghi nhớ thành công
          </p>
        </div>
      </div>
      <div
        className="relative mt-[-10.00px] mb-[-10.00px] flex h-[484px] flex-1 grow flex-col items-start overflow-hidden rounded-3xl bg-cover bg-[50%_50%] max-[767px]:mt-0 max-[767px]:mb-0 max-[767px]:w-full max-[767px]:max-w-[624px]"
        style={{ backgroundImage: `url(${heroImageUrl})` }}
        aria-label="Minh họa thẻ học từ vựng Learn Today"
      >
        <div className="relative flex h-[480px] w-full max-w-[624px] flex-col items-center justify-center rounded-3xl bg-indigo-50 p-8 max-[479px]:p-4">
          <article
            className="relative flex w-[380px] flex-[0_0_auto] flex-col items-start gap-5 rounded-[20px] bg-white p-6 shadow-[0px_12px_32px_#4f46e520] max-[479px]:w-full max-[479px]:p-5"
            aria-label="Thẻ từ vựng Travel"
          >
            <div className="relative flex w-full flex-[0_0_auto] items-center justify-between">
              <span className="relative inline-flex flex-[0_0_auto] items-start rounded-md bg-emerald-50 px-2.5 py-1 [font-family:'Inter',Helvetica] text-base font-bold leading-[normal] tracking-[0] text-emerald-500 whitespace-nowrap">
                DU LỊCH (TRAVEL)
              </span>
              <span className="relative w-fit [font-family:'Inter',Helvetica] text-base font-semibold leading-[normal] tracking-[0] text-slate-500 whitespace-nowrap">
                1 / 40 từ
              </span>
            </div>
            <img
              className="relative h-[180px] w-full object-cover"
              alt="Minh họa cho từ vựng travel"
              src={flashcardPhotoUrl}
            />
            <div className="relative flex w-full flex-[0_0_auto] flex-col items-center gap-1">
              <span className="relative mt-[-1.00px] w-fit [font-family:'Bricolage_Grotesque',Helvetica] text-[28px] font-extrabold leading-[normal] tracking-[0] text-slate-800">
                TRAVEL
              </span>
              <span className="relative w-fit [font-family:'Inter',Helvetica] text-base font-medium leading-[normal] tracking-[0] text-slate-500 whitespace-nowrap">
                ˈtræv.əl
              </span>
            </div>
            <img
              className="relative w-full flex-[0_0_auto]"
              alt="Điều khiển phát âm thanh"
              src={audioControlsUrl}
            />
          </article>
        </div>
      </div>
    </section>
  );
}