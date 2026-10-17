// ProblemSolution.jsx - Đã sửa hoàn chỉnh

const problemPoints = [
  "Học dồn dập 50 từ mới cùng lúc trước ngày thi",
  "Quên tới 80% lượng từ vựng chỉ sau 48 giờ",
  "Không có lộ trình ôn tập định kỳ, dễ nản chí",
  "Học thụ động, thiếu cơ hội luyện viết, thực hành",
];

const solutionPoints = [
  "Học thông minh hơn, không cần học nhiều hơn",
  "Tự động nhắc nhở ôn tập vào đúng khung giờ vàng",
  "Ghi nhớ từ vựng lâu hơn gấp 3 lần với ít nỗ lực hơn",
  "Kết hợp đặt câu thực tế hỗ trợ sửa lỗi tức thì bằng AI",
];

export default function ForgettingProblemSolutionSection() {
  const handleExploreClick = () => {
    const target = document.getElementById("how-it-works");
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <section
      className="relative flex w-full flex-col items-center gap-12 bg-white px-6 py-16 sm:px-10 lg:px-20 lg:py-24"
      aria-labelledby="forgetting-problem-heading"
    >
      <header className="relative flex w-full flex-[0_0_auto] flex-col items-center gap-6 self-stretch">
        <div className="relative flex w-full flex-[0_0_auto] flex-col items-center gap-4 self-stretch">
          <p className="relative mt-[-1.00px] self-stretch text-center font-bold text-sm leading-[normal] tracking-[0.21px] text-indigo-600 [font-family:'Rethink_Sans-Bold',Helvetica]">
            VẤN ĐỀ &amp; GIẢI PHÁP
          </p>
          <h2
            id="forgetting-problem-heading"
            className="relative self-stretch text-center font-bold text-4xl leading-[43.2px] tracking-[0] text-slate-900 [font-family:'Lexend_Deca-Bold',Helvetica]"
          >
            Bạn từng học hàng trăm từ nhưng vài ngày sau quên sạch?
          </h2>
          <p className="relative self-stretch text-center font-normal text-lg leading-[28.8px] tracking-[0] text-slate-600 [font-family:'Rethink_Sans-Regular',Helvetica]">
            Đó là vì bạn chưa ôn tập đúng thời điểm bộ não chuẩn bị quên. Learn
            Today giải quyết triệt để vấn đề này.
          </p>
        </div>
      </header>
      <div className="relative flex w-full flex-[0_0_auto] flex-col items-start gap-8 self-stretch md:flex-row">
        <article className="relative flex flex-1 grow flex-col items-start gap-6 rounded-2xl border border-solid border-red-100 bg-[#fff5f5] p-8">
          <div className="relative inline-flex flex-[0_0_auto] items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-[20px] bg-red-100">
              <div className="relative h-5 w-5">
                <img
                  className="absolute left-[3.33%] top-[24.17%] h-[75.83%] w-[96.67%]"
                  alt=""
                  aria-hidden="true"
                  src="https://c.animaapp.com/zdBS24aH/img/vector-17.svg"
                />
              </div>
            </div>
            <h3 className="relative w-fit font-bold text-xl leading-[normal] tracking-[0] text-red-800 [font-family:'Lexend_Deca-Bold',Helvetica]">
              Học nhồi nhét truyền thống
            </h3>
          </div>
          <ul className="relative self-stretch font-normal text-base leading-[25.6px] tracking-[0] text-red-900 [font-family:'Rethink_Sans-Regular',Helvetica]">
            {problemPoints.map((point) => (
              <li key={point}>• {point}</li>
            ))}
          </ul>
        </article>
        <article className="relative flex flex-1 grow flex-col items-start gap-6 rounded-2xl border border-solid border-indigo-100 bg-[#eef2f6] p-8">
          <div className="relative inline-flex flex-[0_0_auto] items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-[20px] bg-indigo-100">
              <div className="relative h-5 w-5">
                <img
                  className="absolute left-[7.49%] top-[3.32%] h-[96.68%] w-[92.51%]"
                  alt=""
                  aria-hidden="true"
                  src="https://c.animaapp.com/zdBS24aH/img/vector-19.svg"
                />
              </div>
            </div>
            <h3 className="relative w-fit font-bold text-xl leading-[normal] tracking-[0] text-indigo-900 [font-family:'Lexend_Deca-Bold',Helvetica]">
              Học thông minh cùng Learn Today
            </h3>
          </div>
          <ul className="relative self-stretch font-normal text-base leading-[25.6px] tracking-[0] text-slate-900 [font-family:'Rethink_Sans-Regular',Helvetica]">
            {solutionPoints.map((point) => (
              <li key={point}>• {point}</li>
            ))}
          </ul>
        </article>
      </div>
      <button
        type="button"
        onClick={handleExploreClick}
        className="relative inline-flex flex-[0_0_auto] items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 transition-colors hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
      >
        <span className="relative mt-[-1.00px] w-fit font-semibold text-[15px] leading-[normal] tracking-[0] text-white [font-family:'Rethink_Sans-SemiBold',Helvetica]">
          Khám phá cách học
        </span>
      </button>
    </section>
  );
}