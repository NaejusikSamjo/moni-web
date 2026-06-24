"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RiArrowLeftLine, RiCheckLine } from "react-icons/ri";
import { Button } from "@/shared/ui";
import { useAuth, userApi } from "@/features/auth";
import { ApiException } from "@/shared/api/types";
import styles from "./page.module.css";

export default function ProfilePage() {
  const router = useRouter();
  const { user, refreshUser, logout } = useAuth();

  const [name, setName] = useState(user?.name ?? "");
  const [nickname, setNickname] = useState(user?.nickname ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordClosing, setPasswordClosing] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const closePasswordModal = () => {
    setPasswordClosing(true);
    setTimeout(() => {
      setShowPasswordModal(false);
      setPasswordClosing(false);
      setPasswordError(null);
      setPasswordSuccess(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }, 250);
  };

  const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false);
  const [withdrawClosing, setWithdrawClosing] = useState(false);
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  const closeWithdrawModal = () => {
    setWithdrawClosing(true);
    setTimeout(() => {
      setShowWithdrawConfirm(false);
      setWithdrawClosing(false);
    }, 250);
  };

  const isSocialUser = !!user?.provider;

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
      await userApi.updateMe({
        ...(name !== user?.name ? { name } : {}),
        ...(nickname !== user?.nickname ? { nickname } : {}),
        ...(phone !== (user?.phone ?? "") ? { phone } : {}),
      });
      await refreshUser();
      setSuccess(true);
      setTimeout(() => router.back(), 1000);
    } catch (err) {
      setError(err instanceof ApiException ? err.message : "저장 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    setPasswordError(null);
    setPasswordSuccess(false);
    if (newPassword !== confirmPassword) {
      setPasswordError("새 비밀번호가 일치하지 않습니다.");
      return;
    }
    setPasswordLoading(true);
    try {
      await userApi.changePassword({ currentPassword, newPassword });
      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordError(err instanceof ApiException ? err.message : "비밀번호 변경 중 오류가 발생했습니다.");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleWithdraw = async () => {
    setWithdrawLoading(true);
    try {
      await userApi.deleteAccount();
      await logout();
      router.replace("/auth/login");
    } catch {
      setShowWithdrawConfirm(false);
      setError("탈퇴 처리 중 오류가 발생했습니다.");
    } finally {
      setWithdrawLoading(false);
    }
  };

  return (
    <>
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
            <label className={styles.label}>이메일</label>
            <div className={styles.emailBox}>
              <span className={styles.emailValue}>{user?.email}</span>
            </div>
          </div>

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

          <button className={styles.withdrawLink} onClick={() => setShowWithdrawConfirm(true)}>
            탈퇴하기
          </button>


          <div className={styles.spacer} />

          <div className={styles.buttonRow}>
            {!isSocialUser && (
              <Button variant="secondary" size="lg" fullWidth onClick={() => setShowPasswordModal(true)}>
                비밀번호 변경
              </Button>
            )}
            <Button variant="primary" size="lg" fullWidth onClick={handleSave} disabled={loading}>
              {loading ? "저장 중..." : "저장하기"}
            </Button>
          </div>
        </div>
      </div>

      {showPasswordModal && (
        <div className={[styles.overlay, passwordClosing ? styles.overlayClosing : ""].join(" ")}>
          <div className={[styles.modal, passwordClosing ? styles.modalClosing : ""].join(" ")}>
            <h2 className={styles.modalTitle}>비밀번호 변경</h2>

            {passwordError && <p className={styles.errorBox}>{passwordError}</p>}
            {passwordSuccess && (
              <div className={styles.successBox}>
                <RiCheckLine size={16} />
                변경되었습니다
              </div>
            )}

            <div className={styles.fieldGroup}>
              <label className={styles.label}>현재 비밀번호</label>
              <input
                className={styles.input}
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="현재 비밀번호"
                disabled={passwordLoading}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>새 비밀번호</label>
              <input
                className={styles.input}
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="8자 이상, 영문/숫자/특수문자 포함"
                disabled={passwordLoading}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>새 비밀번호 확인</label>
              <input
                className={styles.input}
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="새 비밀번호를 다시 입력하세요"
                disabled={passwordLoading}
              />
            </div>

            <div className={styles.modalActions}>
              <Button variant="secondary" size="md" fullWidth onClick={closePasswordModal}>
                취소
              </Button>
              <Button variant="primary" size="md" fullWidth onClick={handlePasswordChange} disabled={passwordLoading || !currentPassword || !newPassword || !confirmPassword}>
                {passwordLoading ? "변경 중..." : "변경하기"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {showWithdrawConfirm && (
        <div className={[styles.overlay, withdrawClosing ? styles.overlayClosing : ""].join(" ")}>
          <div className={[styles.modal, withdrawClosing ? styles.modalClosing : ""].join(" ")}>
            <h2 className={styles.modalTitle}>정말 탈퇴하시겠어요?</h2>
            <p className={styles.modalDesc}>탈퇴 시 모든 데이터가 삭제되며 복구할 수 없습니다.</p>
            <div className={styles.modalActions}>
              <Button variant="secondary" size="md" fullWidth onClick={closeWithdrawModal} disabled={withdrawLoading}>
                취소
              </Button>
              <Button variant="danger" size="md" fullWidth onClick={handleWithdraw} disabled={withdrawLoading}>
                {withdrawLoading ? "처리 중..." : "탈퇴하기"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
