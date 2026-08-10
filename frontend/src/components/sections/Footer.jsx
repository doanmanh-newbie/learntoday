// Footer.jsx - Đã sửa hoàn chỉnh
import React from "react";

const footerLinks = [
  { label: "Chính sách bảo mật", href: "/privacy-policy" },
  { label: "Điều khoản sử dụng", href: "/terms-of-service" },
  { label: "Liên hệ hỗ trợ", href: "/support" },
];

export default function SiteFooterSection() {
  return (
    <footer className="flex h-[234px] w-full   flex-col items-start gap-12 bg-indigo-950 px-20 pt-16 pb-12">
      <div className="flex w-full items-center justify-between">
        <a
          href="/"
          className="inline-flex items-center gap-2 focus-visible:rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
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
        </a>
        <nav aria-label="Liên kết chân trang">
          <ul className="inline-flex items-start gap-6">
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
      <div className="flex w-full items-start justify-between border-t border-indigo-900 pt-6">
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