// Topics.jsx
import React, { useState } from "react";

const vocabularyTopics = [
  { title: "Gia đình", wordCount: "120 từ", image: "https://c.animaapp.com/zdBS24aH/img/image-container@2x.png" },
  { title: "Du lịch", wordCount: "150 từ", image: "https://c.animaapp.com/zdBS24aH/img/image-container-1@2x.png" },
  { title: "Ẩm thực", wordCount: "180 từ", image: "https://c.animaapp.com/zdBS24aH/img/image-container-2@2x.png" },
  { title: "IELTS", wordCount: "800 từ", image: "https://c.animaapp.com/zdBS24aH/img/image-container-3@2x.png" },
  { title: "TOEIC", wordCount: "650 từ", image: "https://c.animaapp.com/zdBS24aH/img/image-container-4@2x.png" },
];

export default function VocabularyTopicLibrarySection() {
  const [selectedTopic, setSelectedTopic] = useState(null);

  return (
    <section className="flex w-full flex-col bg-slate-50 px-6 py-16 sm:px-10 lg:px-20 lg:py-20" aria-labelledby="vocabulary-topic-library-title">
      <header className="flex w-full flex-col items-start gap-4">
        <div className="inline-flex items-start px-3 py-1.5 relative flex-[0_0_auto] bg-indigo-50 rounded-[100px]">
          <p className="relative w-fit mt-[-1.00px] [font-family:'Rethink_Sans',Helvetica] font-bold text-indigo-600 text-xs tracking-[0.14px] leading-[normal]">KHÁM PHÁ GIAO DIỆN MỚI</p>
        </div>
        <h2 id="vocabulary-topic-library-title" className="relative self-stretch [font-family:'Lexend_Deca',Helvetica] font-extrabold text-slate-900 text-4xl tracking-[0] leading-[43.2px]">Thư Viện Chủ Đề Từ Vựng</h2>
        <p className="relative w-full max-w-[800px] [font-family:'Rethink_Sans',Helvetica] font-normal text-slate-600 text-base tracking-[0] leading-[25.6px]">Trải nghiệm tính năng phân loại thông minh với hai biến thể tuyệt đẹp: lựa chọn hình ảnh từ hệ thống tinh tuyển hoặc tự do sáng tạo bằng cách tải lên hình ảnh cá nhân của riêng bạn.</p>
      </header>
      <div className="mt-12 flex w-full flex-col items-start gap-4">
        <div className="inline-flex items-center gap-2 relative flex-[0_0_auto]">
          <span className="text-indigo-600 relative w-fit mt-[-1.00px] [font-family:'Lexend_Deca',Helvetica] font-extrabold text-sm tracking-[0.21px] leading-[normal]">VARIANT A</span>
          <span className="relative w-fit mt-[-1.00px] [font-family:'Rethink_Sans',Helvetica] font-normal text-slate-400 text-sm tracking-[0] leading-[normal]" aria-hidden="true">•</span>
          <p className="relative w-fit mt-[-1.00px] [font-family:'Rethink_Sans',Helvetica] font-semibold text-slate-600 text-sm tracking-[0] leading-[normal]">System Images (Hình ảnh hệ thống sẵn có)</p>
        </div>
        <ul className="grid w-full grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 lg:gap-6" aria-label="Danh sách chủ đề từ vựng">
          {vocabularyTopics.map((topic) => (
            <li key={topic.title}>
              <button type="button" className="flex w-full flex-col items-start gap-4 rounded-2xl border border-solid border-slate-200 bg-white p-3 text-left shadow-[0px_4px_16px_#0f172a0a] cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600" aria-label={`Chọn chủ đề ${topic.title}, ${topic.wordCount}`} aria-pressed={selectedTopic === topic.title} onClick={() => setSelectedTopic(topic.title)}>
                <div className="relative self-stretch w-full rounded-[10px] aspect-[1] bg-cover bg-[50%_50%]" style={{ backgroundImage: `url(${topic.image})` }} aria-hidden="true" />
                <div className="flex flex-col items-start gap-1 relative self-stretch w-full flex-[0_0_auto]">
                  <span className="relative self-stretch mt-[-1.00px] [font-family:'Lexend_Deca',Helvetica] font-bold text-slate-900 text-base tracking-[0] leading-[normal]">{topic.title}</span>
                  <span className="relative self-stretch [font-family:'Rethink_Sans',Helvetica] font-normal text-slate-600 text-[13px] tracking-[0] leading-[normal]">{topic.wordCount}</span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>
      <img className="mt-12 w-full max-h-px object-cover" alt="" aria-hidden="true" src="https://c.animaapp.com/zdBS24aH/img/line.svg" />
    </section>
  );
}