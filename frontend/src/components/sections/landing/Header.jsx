// Header.jsx - Đã sửa hoàn chỉnh
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";

export default function SiteHeaderSection() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

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
    <header className="relative flex w-full flex-wrap items-center justify-between gap-4 border border-solid border-slate-200 bg-white px-4 py-3 sm:px-8 lg:h-20 lg:flex-nowrap lg:px-20 lg:py-0">
      <Link
      to="/"
      className="relative inline-flex flex-[0_0_auto] items-center gap-2 rounded-md no-underline transition-opacity duration-200 hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-600"
      aria-label="Learn Today - Về trang chủ"
    >
      <img
        className="relative h-9 w-9"
        alt=""
        aria-hidden="true"
        src="https://c.animaapp.com/zdBS24aH/img/frame.svg"
      />
      <div className="relative w-fit [font-family:'Lexend_Deca',Helvetica] text-[22px] font-extrabold leading-[normal] tracking-[0] text-indigo-600">
        Learn Today
        </div>
      </Link>
      <form
        className="relative order-3 flex h-11 w-full min-w-0 items-center gap-2 rounded-[99px] border border-solid border-slate-200 bg-slate-50 px-4 py-0 sm:max-w-[430px] lg:order-none lg:w-[430px] lg:flex-1"
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
      <div className="relative inline-flex flex-[0_0_auto] flex-wrap items-center gap-2 sm:gap-3">
        <button
          className="all-unset box-border relative inline-flex flex-[0_0_auto] items-center justify-center gap-2 rounded-lg bg-[#eef2f6] px-4 py-2.5 sm:px-6 sm:py-3"
          type="button"
          onClick={handlePremiumClick}
        >
          <span className="relative mt-[-1.00px] w-fit whitespace-nowrap [font-family:'Rethink_Sans',Helvetica] text-[15px] font-semibold leading-[normal] tracking-[0] text-indigo-600">
            Nâng cấp Premium
          </span>
        </button>
        {isAuthenticated ? (
          <>
            <span className="relative hidden items-center px-3 py-2 sm:inline-flex">
              <span className="relative mt-[-1.00px] w-fit whitespace-nowrap [font-family:'Rethink_Sans',Helvetica] text-[15px] font-semibold leading-[normal] tracking-[0] text-slate-600">
                Xin chào, {user?.username ?? "bạn"}
              </span>
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="all-unset box-border relative inline-flex flex-[0_0_auto] cursor-pointer items-center justify-center gap-2 rounded-lg border border-solid border-slate-200 px-4 py-2.5 sm:px-6 sm:py-3"
            >
              <span className="relative mt-[-1.00px] w-fit whitespace-nowrap [font-family:'Rethink_Sans',Helvetica] text-[15px] font-semibold leading-[normal] tracking-[0] text-slate-600">
                Đăng xuất
              </span>
            </button>
          </>
        ) : (
          <>
            <Link
              className="relative inline-flex flex-[0_0_auto] items-start px-3 py-2 no-underline"
              to="/login"
            >
              <span className="relative mt-[-1.00px] w-fit whitespace-nowrap [font-family:'Rethink_Sans',Helvetica] text-[15px] font-semibold leading-[normal] tracking-[0] text-slate-600">
                Đăng nhập
              </span>
            </Link>
            <Link
              className="relative inline-flex flex-[0_0_auto] items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 no-underline sm:px-6 sm:py-3"
              to="/register"
            >
              <span className="relative mt-[-1.00px] w-fit whitespace-nowrap [font-family:'Rethink_Sans',Helvetica] text-[15px] font-semibold leading-[normal] tracking-[0] text-white">
                Đăng ký
              </span>
            </Link>
          </>
        )}
      </div>
      <p className="sr-only" aria-live="polite">
        {statusMessage}
      </p>
    </header>
  );
}