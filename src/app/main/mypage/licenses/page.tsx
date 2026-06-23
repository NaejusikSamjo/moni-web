"use client";

import { useRouter } from "next/navigation";
import { RiArrowLeftLine } from "react-icons/ri";
import styles from "./page.module.css";

const LICENSES = [
  {
    name: "Next.js",
    version: "16.2.7",
    license: "MIT",
    author: "Vercel, Inc.",
    url: "https://nextjs.org",
  },
  {
    name: "React",
    version: "19.2.7",
    license: "MIT",
    author: "Meta Platforms, Inc.",
    url: "https://react.dev",
  },
  {
    name: "React DOM",
    version: "19.2.7",
    license: "MIT",
    author: "Meta Platforms, Inc.",
    url: "https://react.dev",
  },
  {
    name: "React Icons",
    version: "5.6.0",
    license: "MIT",
    author: "Goran Gajic",
    url: "https://react-icons.github.io/react-icons",
  },
  {
    name: "TypeScript",
    version: "6.0.3",
    license: "Apache-2.0",
    author: "Microsoft Corporation",
    url: "https://www.typescriptlang.org",
  },
];

export default function LicensesPage() {
  const router = useRouter();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.back()} aria-label="뒤로가기">
          <RiArrowLeftLine size={20} />
        </button>
        <span className={styles.headerTitle}>오픈소스 라이선스</span>
      </header>

      <div className={styles.content}>
        <p className={styles.intro}>
          모니는 아래 오픈소스 소프트웨어를 사용합니다.
        </p>

        <ul className={styles.list}>
          {LICENSES.map((item) => (
            <li key={item.name} className={styles.item}>
              <div className={styles.itemTop}>
                <span className={styles.itemName}>{item.name}</span>
                <span className={styles.badge}>{item.license}</span>
              </div>
              <span className={styles.itemMeta}>
                v{item.version} · {item.author}
              </span>
            </li>
          ))}
        </ul>

        <p className={styles.footer}>
          각 라이선스의 전문은 해당 패키지 저장소에서 확인하실 수 있습니다.
        </p>
      </div>
    </div>
  );
}
