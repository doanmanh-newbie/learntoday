// Footer.jsx - Đã sửa hoàn chỉnh
import React from "react";
import { Link } from "react-router-dom";
const footerLinks = [
  { label: "Chính sách bảo mật", href: "/privacy-policy" },
  { label: "Điều khoản sử dụng", href: "/terms-of-service" },
  { label: "Liên hệ hỗ trợ", href: "/support" },
];

export default function SiteFooterSection() {
  return (
    <footer className="flex w-full flex-col items-start gap-8 bg-indigo-950 px-6 pt-12 pb-10 sm:px-10 sm:gap-12 sm:pt-16 sm:pb-12 lg:px-20">
      <div className="flex w-full flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-2 no-underline focus-visible:rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          aria-label="Learn Today - Trang chủ"
        >
          <img
            className="h-8 w-8"
            alt=""
            aria-hidden="true"
            src="https://c.animaapp.com/zdBS24aH/img/frame-19.svg"
          />
          <span className="w-fit [font-family:'Lexend_Deca',Helvetica] text-xl font-extrabold leading-[normal] tracking-[0] text-white">
            Learn Today
          </span>
        </Link>
        <nav aria-label="Liên kết chân trang">
          <ul className="flex flex-wrap items-start gap-x-6 gap-y-2">
            {footerLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="mt-[-1px] block w-fit [font-family:'Rethink_Sans',Helvetica] text-sm font-normal leading-[normal] tracking-[0] text-slate-400 transition-colors hover:text-white focus-visible:rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="flex w-full flex-col items-start gap-2 border-t border-indigo-900 pt-6 sm:flex-row sm:items-start sm:justify-between sm:gap-0">
        <p className="mt-[-1px] w-fit [font-family:'Rethink_Sans',Helvetica] text-sm font-normal leading-[normal] tracking-[0] text-slate-500">
          © 2024 Learn Today. All rights reserved.
        </p>
        <p className="mt-[-1px] w-fit [font-family:'Rethink_Sans',Helvetica] text-sm font-normal leading-[normal] tracking-[0] text-slate-500">
          Made with{" "}
          <span role="img" aria-label="love">
            ❤️
          </span>{" "}
          for English learners.
        </p>
      </div>
    </footer>
  );
}