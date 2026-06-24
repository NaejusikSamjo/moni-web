"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { RiHome5Line, RiHome5Fill } from "react-icons/ri";
import { RiLineChartLine, RiLineChartFill } from "react-icons/ri";
import { RiStarLine, RiStarFill } from "react-icons/ri";
import { RiPieChartLine, RiPieChartFill } from "react-icons/ri";
import { RiUser3Line, RiUser3Fill } from "react-icons/ri";
import styles from "./BottomNav.module.css";

const navItems = [
  { href: "/main/dashboard",  label: "홈",      Icon: RiHome5Line,    IconActive: RiHome5Fill },
  { href: "/main/stocks",     label: "투자",    Icon: RiLineChartLine, IconActive: RiLineChartFill },
  { href: "/main/watchlist",  label: "관심",    Icon: RiStarLine,      IconActive: RiStarFill },
  { href: "/main/portfolio",  label: "포트폴리오", Icon: RiPieChartLine, IconActive: RiPieChartFill },
  { href: "/main/mypage",     label: "마이",    Icon: RiUser3Line,     IconActive: RiUser3Fill },
];

const HIDE_PATHS = ["/main/mypage/profile"];

export function BottomNav() {
  const pathname = usePathname();

  if (HIDE_PATHS.some((p) => pathname.startsWith(p))) return null;

  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        {navItems.map(({ href, label, Icon, IconActive }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={[styles.item, isActive ? styles.active : ""].join(" ")}
            >
              {isActive ? <IconActive size={22} /> : <Icon size={22} />}
              <span className={styles.label}>{label}</span>
            </Link>
          );
        })}
        {/* 슬라이딩 인디케이터 — items 뒤에 위치해야 nth-child(1~4) 유지 */}
        <div className={styles.indicator} aria-hidden="true" />
      </div>
    </nav>
  );
}
