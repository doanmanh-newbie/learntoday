// Stats.jsx - Đã sửa: bỏ cú pháp TypeScript, đổi sang export default
import React from "react";

const vocabularyCategories = [
  {
    name: "Gia đình",
    count: "120 từ",
    icon: "https://c.animaapp.com/zdBS24aH/img/frame-14.svg",
  },
  {
    name: "Du lịch",
    count: "150 từ",
    icon: "https://c.animaapp.com/zdBS24aH/img/frame-15.svg",
  },
  {
    name: "Ẩm thực",
    count: "180 từ",
    icon: "https://c.animaapp.com/zdBS24aH/img/frame-16.svg",
  },
  {
    name: "IELTS",
    count: "800 từ",
    icon: "https://c.animaapp.com/zdBS24aH/img/frame-17.svg",
  },
  {
    name: "TOEIC",
    count: "650 từ",
    icon: "https://c.animaapp.com/zdBS24aH/img/frame-18.svg",
  },
];

export default function VocabularyLibraryStatsSection() {
  return (
    <section
      className="flex w-[1440px] h-[482px] relative flex-col items-center gap-12 px-20 py-24 bg-white"
      aria-labelledby="vocabulary-library-heading"
    >
      <header className="flex flex-col items-center gap-4 relative self-stretch w-full flex-[0_0_auto]">
        <p className="relative self-stretch mt-[-1.00px] [font-family:'Rethink_Sans',Helvetica] font-bold text-indigo-600 text-sm text-center tracking-[0.21px] leading-[normal]">
          THƯ VIỆN ĐA DẠNG
        </p>
        <h2
          id="vocabulary-library-heading"
          className="relative self-stretch [font-family:'Lexend_Deca',Helvetica] font-bold text-slate-900 text-4xl text-center tracking-[0] leading-[43.2px]"
        >
          3000+ từ vựng theo mọi chủ đề bạn chọn
        </h2>
      </header>
      <ul className="flex items-start gap-5 relative self-stretch w-full flex-[0_0_auto] list-none m-0 p-0">
        {vocabularyCategories.map((category) => (
          <li
            key={category.name}
            className="flex flex-col items-center gap-4 p-6 relative flex-1 grow bg-white rounded-2xl border border-solid border-slate-200 shadow-[0px_4px_10px_#0f172a04]"
          >
            <img
              className="relative w-14 h-14"
              alt=""
              aria-hidden="true"
              src={category.icon}
            />
            <div className="inline-flex flex-col items-center gap-1 relative flex-[0_0_auto]">
              <h3 className="relative w-fit mt-[-1.00px] [font-family:'Lexend_Deca',Helvetica] font-bold text-slate-900 text-lg tracking-[0] leading-[normal]">
                {category.name}
              </h3>
              <p className="w-fit [font-family:'Rethink_Sans',Helvetica] font-normal text-slate-400 text-sm relative tracking-[0] leading-[normal]">
                {category.count}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}