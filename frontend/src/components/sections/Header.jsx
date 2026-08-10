// Header.jsx - Đã sửa hoàn chỉnh
import React, { useState } from "react";

export default function SiteHeaderSection() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const query = searchQuery.trim();
    if (!query) {
      setStatusMessage("Vui lòng nhập từ vựng cần tìm kiếm.");
      return;
    }
    setStatusMessage(`Đang tìm kiếm từ vựng: ${query}`);
    window.dispatchEvent(
      new CustomEvent("learn-today-search", {
        detail: { query },
      })
    );
  };

  const handlePremiumClick = () => {
    window.dispatchEvent(new CustomEvent("learn-today-premium"));
  };

  return (
    <header className="relative flex h-20 w-accent-full items-center justify-between border border-solid border-slate-200 bg-white px-20 py-0">
      <div className="relative inline-flex flex-[0_0_auto] items-center gap-2">
        <img
          className="relative h-9 w-9"
          alt=""
          aria-hidden="true"
          src="https://c.animaapp.com/zdBS24aH/img/frame.svg"
        />
        <div className="relative w-fit [font-family:'Lexend_Deca',Helvetica] text-[22px] font-extrabold leading-[normal] tracking-[0] text-indigo-600">
          Learn Today
        </div>
      </div>
      <form
        className="relative flex h-11 w-[430px] items-center gap-2 rounded-[99px] border border-solid border-slate-200 bg-slate-50 px-4 py-0"
        role="search"
        onSubmit={handleSearchSubmit}
      >
        <svg
          className="relative h-[18px] w-[18px] shrink-0 text-slate-600"
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <label className="sr-only" htmlFor="vocabulary-search">
          Tìm kiếm từ vựng
        </label>
        <input
          id="vocabulary-search"
          className="relative min-w-0 flex-1 [font-family:'Rethink_Sans',Helvetica] text-sm font-normal leading-[normal] tracking-[0] text-slate-600 placeholder:text-slate-600"
          type="search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Tìm kiếm từ vựng..."
          autoComplete="off"
        />
      </form>
      <div className="relative inline-flex flex-[0_0_auto] items-center gap-3">
        <button
          className="all-unset box-border relative inline-flex flex-[0_0_auto] items-center justify-center gap-2 rounded-lg bg-[#eef2f6] px-6 py-3"
          type="button"
          onClick={handlePremiumClick}
        >
          <span className="relative mt-[-1.00px] w-fit [font-family:'Rethink_Sans',Helvetica] text-[15px] font-semibold leading-[normal] tracking-[0] text-indigo-600">
            Nâng cấp Premium
          </span>
        </button>
        <a
          className="relative inline-flex flex-[0_0_auto] items-start px-3 py-2 no-underline"
          href="/login"
        >
          <span className="relative mt-[-1.00px] w-fit [font-family:'Rethink_Sans',Helvetica] text-[15px] font-semibold leading-[normal] tracking-[0] text-slate-600">
            Đăng nhập
          </span>
        </a>
        <a
          className="relative inline-flex flex-[0_0_auto] items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 no-underline"
          href="/register"
        >
          <span className="relative mt-[-1.00px] w-fit [font-family:'Rethink_Sans',Helvetica] text-[15px] font-semibold leading-[normal] tracking-[0] text-white">
            Đăng ký
          </span>
        </a>
      </div>
      <p className="sr-only" aria-live="polite">
        {statusMessage}
      </p>
    </header>
  );
}