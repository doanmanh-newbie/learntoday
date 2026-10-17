// LearningLoop.jsx - Giữ nguyên cấu trúc, chỉ sửa lỗi TypeScript

// Đã xóa type LearningStep và khai báo trực tiếp mảng steps
// Ghi chú: các biến thể width/height cố định (w-60/w-72/w-[290px], absolute...) của
// từng thẻ trong bản gốc chỉ là khác biệt trình bày ngẫu nhiên từ file thiết kế,
// không mang ý nghĩa nội dung => đã gộp lại dùng chung 1 layout thẻ nhất quán,
// responsive, để cả 4 bước hiển thị đều nhau trên mọi kích thước màn hình.
const cardClassName =
  "flex h-full w-full flex-col items-start gap-4 rounded-2xl border border-solid border-slate-200 bg-white p-6";
const headerClassName = "flex w-full flex-[0_0_auto] items-center justify-between";
const numberClassName =
  "relative mt-[-1.00px] w-fit text-[28px] leading-[normal] tracking-[0] text-indigo-600 [font-family:'Lexend_Deca',Helvetica] font-extrabold";
const iconClassName = "relative h-6 w-6";
const contentClassName = "flex w-full flex-[0_0_auto] flex-col items-start gap-2";
const titleClassName =
  "relative self-stretch [font-family:'Lexend_Deca',Helvetica] text-lg font-bold leading-[normal] tracking-[0] text-slate-900";
const descriptionClassName =
  "relative self-stretch [font-family:'Rethink_Sans',Helvetica] text-sm font-normal leading-[21px] tracking-[0] text-slate-600";

const learningSteps = [
  {
    number: "01",
    title: "Nhập chính tả",
    description:
      "Giúp tay và tai làm quen với cách phát âm và cấu trúc từ mới.",
    icon: "https://c.animaapp.com/zdBS24aH/img/frame-11.svg",
  },
  {
    number: "02",
    title: "Trắc nghiệm",
    description: "Thử thách nhận diện phản xạ nghĩa từ vựng nhanh dưới áp lực.",
    icon: "https://c.animaapp.com/zdBS24aH/img/frame-12.svg",
  },
  {
    number: "03",
    title: "Điền từ",
    description:
      "Đưa từ vựng vào đúng ngữ cảnh của câu hoàn chỉnh để nắm vững cách dùng.",
    icon: "https://c.animaapp.com/zdBS24aH/img/frame-13.svg",
  },
  {
    number: "04",
    title: "Ghép từ",
    description:
      "Kết hợp linh hoạt từ và định nghĩa giúp củng cố liên kết sâu sắc nhất.",
    icon: null,
  },
];

export default function SpacedRepetitionProcessSection() {
  return (
    <section
      className="flex w-full relative flex-col items-center gap-12 px-6 py-16 sm:px-10 lg:px-20 lg:py-24 bg-slate-50"
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
      <ol className="grid w-full list-none grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {learningSteps.map((step) => (
          <li key={step.number} className="h-full">
            <article className={cardClassName}>
              <div className={headerClassName}>
                <span className={numberClassName}>{step.number}</span>
                {step.icon ? (
                  <img
                    className={iconClassName}
                    alt=""
                    aria-hidden="true"
                    src={step.icon}
                  />
                ) : null}
              </div>
              <div className={contentClassName}>
                <h3 className={titleClassName}>{step.title}</h3>
                <p className={descriptionClassName}>{step.description}</p>
              </div>
            </article>
          </li>
        ))}
      </ol>
    </section>
  );
}