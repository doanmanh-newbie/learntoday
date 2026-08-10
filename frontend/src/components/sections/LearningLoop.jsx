// LearningLoop.jsx - Giữ nguyên cấu trúc, chỉ sửa lỗi TypeScript
import React from "react";

// Đã xóa type LearningStep và khai báo trực tiếp mảng steps
const learningSteps = [
  {
    number: "01",
    title: "Nhập chính tả",
    description:
      "Giúp tay và tai làm quen với cách phát âm và cấu trúc từ mới.",
    icon: "https://c.animaapp.com/zdBS24aH/img/frame-11.svg",
    wrapperClassName: "",
    cardClassName:
      "flex flex-col w-60 h-[210px] items-center justify-center gap-4 p-6 relative bg-white rounded-2xl border border-solid border-slate-200",
    headerClassName:
      "flex items-center justify-between relative self-stretch w-full flex-[0_0_auto]",
    numberClassName:
      "mt-[-1.00px] text-[28px] relative w-fit [font-family:'Lexend_Deca',Helvetica] font-extrabold text-indigo-600 tracking-[0] leading-[normal]",
    iconClassName: "relative w-6 h-6",
    contentClassName:
      "flex flex-col items-start gap-2 relative self-stretch w-full flex-[0_0_auto]",
    titleClassName:
      "relative self-stretch mt-[-1.00px] [font-family:'Lexend_Deca',Helvetica] font-bold text-slate-900 text-lg tracking-[0] leading-[normal]",
    descriptionClassName:
      "relative self-stretch [font-family:'Rethink_Sans',Helvetica] font-normal text-slate-600 text-sm tracking-[0] leading-[21px]",
  },
  {
    number: "02",
    title: "Trắc nghiệm",
    description: "Thử thách nhận diện phản xạ nghĩa từ vựng nhanh dưới áp lực.",
    icon: "https://c.animaapp.com/zdBS24aH/img/frame-12.svg",
    wrapperClassName:
      "flex flex-col w-72 h-[258px] items-center justify-center gap-2.5 p-2.5 relative",
    cardClassName:
      "flex flex-col w-60 h-[210px] items-start gap-4 p-6 relative bg-white rounded-2xl border border-solid border-slate-200",
    headerClassName:
      "flex items-center justify-between relative self-stretch w-full flex-[0_0_auto]",
    numberClassName:
      "mt-[-1.00px] text-[28px] relative w-fit [font-family:'Lexend_Deca',Helvetica] font-extrabold text-indigo-600 tracking-[0] leading-[normal]",
    iconClassName: "relative w-6 h-6",
    contentClassName:
      "flex flex-col items-start gap-2 relative self-stretch w-full flex-[0_0_auto]",
    titleClassName:
      "relative self-stretch mt-[-1.00px] [font-family:'Lexend_Deca',Helvetica] font-bold text-slate-900 text-lg tracking-[0] leading-[normal]",
    descriptionClassName:
      "relative self-stretch [font-family:'Rethink_Sans',Helvetica] font-normal text-slate-600 text-sm tracking-[0] leading-[21px]",
  },
  {
    number: "03",
    title: "Điền từ",
    description:
      "Đưa từ vựng vào đúng ngữ cảnh của câu hoàn chỉnh để nắm vững cách dùng.",
    icon: "https://c.animaapp.com/zdBS24aH/img/frame-13.svg",
    wrapperClassName:
      "flex flex-col w-72 h-[252px] items-center justify-center gap-2.5 p-2.5 relative",
    cardClassName:
      "relative w-60 h-[210px] bg-white rounded-[17.2px] border-[1.07px] border-solid border-slate-200",
    headerClassName:
      "flex w-[calc(100%_-_52px)] h-[38px] items-center justify-between absolute top-[26px] left-[26px]",
    numberClassName:
      "mt-[-1.26px] text-[30.1px] relative w-fit [font-family:'Lexend_Deca',Helvetica] font-extrabold text-indigo-600 tracking-[0] leading-[normal]",
    iconClassName: "relative w-[25.8px] h-[25.8px]",
    contentClassName:
      "flex flex-col w-[calc(100%_-_52px)] items-start gap-[8.6px] absolute top-[81px] left-[26px]",
    titleClassName:
      "relative self-stretch mt-[-1.07px] [font-family:'Lexend_Deca',Helvetica] font-bold text-slate-900 text-[19.4px] tracking-[0] leading-[normal]",
    descriptionClassName:
      "relative self-stretch [font-family:'Rethink_Sans',Helvetica] font-normal text-slate-600 text-[15px] tracking-[0] leading-[22.6px]",
  },
  {
    number: "04",
    title: "Ghép từ",
    description:
      "Kết hợp linh hoạt từ và định nghĩa giúp củng cố liên kết sâu sắc nhất.",
    wrapperClassName:
      "flex flex-col w-[290px] items-center justify-center gap-2.5 px-2.5 py-[21px] relative",
    cardClassName:
      "relative w-60 h-[210px] bg-white rounded-2xl border border-solid border-slate-200",
    headerClassName:
      "flex w-[calc(100%_-_48px)] h-[35px] items-center justify-around absolute top-6 left-6",
    numberClassName:
      "mt-[-1.00px] text-[28px] relative w-fit [font-family:'Lexend_Deca',Helvetica] font-extrabold text-indigo-600 tracking-[0] leading-[normal]",
    contentClassName:
      "flex flex-col w-[calc(100%_-_48px)] items-start gap-2 absolute top-[75px] left-6",
    titleClassName:
      "relative self-stretch mt-[-1.00px] [font-family:'Lexend_Deca',Helvetica] font-bold text-slate-900 text-lg tracking-[0] leading-[normal]",
    descriptionClassName:
      "relative self-stretch [font-family:'Rethink_Sans',Helvetica] font-normal text-slate-600 text-sm tracking-[0] leading-[21px]",
  },
];

export default function SpacedRepetitionProcessSection() {
  return (
    <section
      className="flex w-[1440px] h-[604px] relative flex-col items-center gap-12 px-20 py-24 bg-slate-50"
      aria-labelledby="spaced-repetition-title"
    >
      <header className="flex flex-col items-center gap-4 relative self-stretch w-full flex-[0_0_auto]">
        <p className="relative self-stretch mt-[-1.00px] [font-family:'Rethink_Sans',Helvetica] font-bold text-indigo-600 text-sm text-center tracking-[0.21px] leading-[normal]">
          PHƯƠNG PHÁP HỌC
        </p>
        <h2
          id="spaced-repetition-title"
          className="relative self-stretch [font-family:'Lexend_Deca',Helvetica] font-bold text-slate-900 text-4xl text-center tracking-[0] leading-[43.2px]"
        >
          Vòng lặp thông minh: Học → Ôn đúng lúc → Nhớ mãi
        </h2>
        <p className="relative self-stretch [font-family:'Rethink_Sans',Helvetica] font-normal text-slate-600 text-lg text-center tracking-[0] leading-[28.8px]">
          Mỗi từ vựng được rèn luyện toàn diện thông qua chuỗi 4 bài tập thực
          hành tương tác sâu sắc
        </p>
      </header>
      <ol className="inline-flex list-none items-center gap-20 px-[31px] py-[21px] relative flex-[0_0_auto] mb-[-58.00px] ml-[-64.00px] mr-[-64.00px]">
        {learningSteps.map((step) => (
          <li key={step.number} className={step.wrapperClassName}>
            <article className={step.cardClassName}>
              <div className={step.headerClassName}>
                <span className={step.numberClassName}>{step.number}</span>
                {step.icon ? (
                  <img
                    className={step.iconClassName}
                    alt=""
                    aria-hidden="true"
                    src={step.icon}
                  />
                ) : null}
              </div>
              <div className={step.contentClassName}>
                <h3 className={step.titleClassName}>{step.title}</h3>
                <p className={step.descriptionClassName}>{step.description}</p>
              </div>
            </article>
          </li>
        ))}
      </ol>
    </section>
  );
}