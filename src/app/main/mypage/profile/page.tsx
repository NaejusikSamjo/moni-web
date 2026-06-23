"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RiArrowLeftLine, RiCheckLine } from "react-icons/ri";
import { Button } from "@/shared/ui";
import { useAuth, authApi } from "@/features/auth";
import { ApiException } from "@/shared/api/types";
import styles from "./page.module.css";

export default function ProfilePage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();

  const [name, setName] = useState(user?.name ?? "");
  const [nickname, setNickname] = useState(user?.nickname ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  };

  const handleSave = async () => {
    setError(null);
    setSuccess(false);
    setLoading(true);
    try {
      await authApi.updateMe({
        ...(name !== user?.name ? { name } : {}),
        ...(nickname !== user?.nickname ? { nickname } : {}),
        ...(phone !== (user?.phone ?? "") ? { phone } : {}),
        ...(password ? { password } : {}),
      });
      await refreshUser();
      setPassword("");
      setSuccess(true);
    } catch (err) {
      if (err instanceof ApiException) {
        setError(err.message);
      } else {
        setError("저장 중 오류가 발생했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.back()}>
          <RiArrowLeftLine size={22} />
        </button>
        <h1 className={styles.title}>내 정보 수정</h1>
        <div className={styles.headerSpacer} />
      </header>

      <div className={styles.content}>
        {error && <p className={styles.errorBox}>{error}</p>}
        {success && (
          <div className={styles.successBox}>
            <RiCheckLine size={16} />
            저장되었습니다
          </div>
        )}

        <div className={styles.fieldGroup}>
          <label className={styles.label}>이름</label>
          <input
            className={styles.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="홍길동"
            disabled={loading}
          />
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.label}>닉네임</label>
          <input
            className={styles.input}
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="닉네임을 입력하세요"
            disabled={loading}
          />
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.label}>전화번호</label>
          <input
            className={styles.input}
            type="tel"
            value={phone}
            onChange={(e) => setPhone(formatPhone(e.target.value))}
            placeholder="010-1234-5678"
            disabled={loading}
          />
        </div>

        {!user?.phone && (
          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              새 비밀번호 <span className={styles.labelOptional}>(변경 시 입력)</span>
            </label>
            <input
              className={styles.input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="8자 이상, 영문/숫자/특수문자 포함"
              disabled={loading}
            />
          </div>
        )}

        <div className={styles.emailRow}>
          <span className={styles.emailLabel}>이메일</span>
          <span className={styles.emailValue}>{user?.email}</span>
        </div>

        <Button variant="primary" size="lg" fullWidth onClick={handleSave} disabled={loading}>
          {loading ? "저장 중..." : "저장하기"}
        </Button>
      </div>
    </div>
  );
}
