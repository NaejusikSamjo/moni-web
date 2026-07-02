"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import { RiArrowLeftLine, RiCheckLine, RiCameraLine, RiImageLine, RiUploadCloud2Line, RiLoaderLine, RiGoogleLine, RiLinkM } from "react-icons/ri";
import { RiKakaoTalkFill } from "react-icons/ri";
import { Button, BottomSheet } from "@/shared/ui";
import { useAuth, userApi } from "@/features/auth";
import { ApiException } from "@/shared/api/types";
import styles from "./page.module.css";

const EMOJIS = [
  "😀","😂","🥰","😎","🤩","🥳",
  "😴","🤔","😤","🤗","😈","🫡",
  "👋","👍","👏","🙌","💪","🤞",
  "🦁","🐯","🐻","🦊","🐼","🐨",
  "🐸","🦋","🌟","🔥","💎","🎯",
  "🚀","🌈","🎵","💡","🏆","🎲",
];

const ALLOWED_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const MAX_SIZE_MB = 5;

type ProfileTab = "emoji" | "image";

async function getCroppedFile(imageSrc: string, pixelCrop: Area): Promise<File> {
  const image = new window.Image();
  image.src = imageSrc;
  await new Promise<void>((resolve) => { image.onload = () => resolve(); });

  const canvas = document.createElement("canvas");
  canvas.width = 500;
  canvas.height = 500;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, 500, 500);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(new File([blob!], "profile.jpg", { type: "image/jpeg" }));
    }, "image/jpeg", 0.92);
  });
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, refreshUser, logout } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(user?.name ?? "");
  const [nickname, setNickname] = useState(user?.nickname ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // 프로필 대기 상태
  const [pendingEmoji, setPendingEmoji] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPreviewUrl, setPendingPreviewUrl] = useState<string | null>(null);
  const [pendingRemove, setPendingRemove] = useState(false);

  // 바텀시트
  const [showProfileSheet, setShowProfileSheet] = useState(false);
  const [profileClosing, setProfileClosing] = useState(false);
  const [profileTab, setProfileTab] = useState<ProfileTab>("emoji");
  const [profileError, setProfileError] = useState<string | null>(null);

  // 바텀시트 내부 draft
  const [draftEmoji, setDraftEmoji] = useState<string | null>(null);
  const [draftFile, setDraftFile] = useState<File | null>(null);
  const [draftPreviewUrl, setDraftPreviewUrl] = useState<string | null>(null);

  // 크롭
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [cropLoading, setCropLoading] = useState(false);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordClosing, setPasswordClosing] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false);
  const [withdrawClosing, setWithdrawClosing] = useState(false);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawPassword, setWithdrawPassword] = useState("");
  const [withdrawPasswordError, setWithdrawPasswordError] = useState<string | null>(null);

  const [showIntegrateSheet, setShowIntegrateSheet] = useState(false);
  const [integrateClosing, setIntegrateClosing] = useState(false);
  const [integratePassword, setIntegratePassword] = useState("");
  const [integrateConfirm, setIntegrateConfirm] = useState("");
  const [integrateError, setIntegrateError] = useState<string | null>(null);
  const [integrateLoading, setIntegrateLoading] = useState(false);

  const isSocialUser = !!user?.oauthProvider && !user?.integrated;

  useEffect(() => {
    return () => {
      if (pendingPreviewUrl) URL.revokeObjectURL(pendingPreviewUrl);
    };
  }, [pendingPreviewUrl]);

  const openProfileSheet = () => {
    setDraftEmoji(pendingEmoji);
    setDraftFile(pendingFile);
    setDraftPreviewUrl(pendingPreviewUrl);
    setProfileError(null);
    setShowProfileSheet(true);
  };

  const closeProfileSheet = () => {
    setProfileClosing(true);
    setTimeout(() => {
      setShowProfileSheet(false);
      setProfileClosing(false);
      setProfileError(null);
      if (draftPreviewUrl && draftPreviewUrl !== pendingPreviewUrl) {
        URL.revokeObjectURL(draftPreviewUrl);
      }
      setDraftEmoji(null);
      setDraftFile(null);
      setDraftPreviewUrl(null);
    }, 250);
  };

  const handleProfileConfirm = () => {
    if (pendingPreviewUrl && pendingPreviewUrl !== draftPreviewUrl) {
      URL.revokeObjectURL(pendingPreviewUrl);
    }
    setPendingEmoji(draftEmoji);
    setPendingFile(draftFile);
    setPendingPreviewUrl(draftPreviewUrl);
    setPendingRemove(false);
    closeProfileSheet();
  };

  const handleDraftSelectEmoji = (emoji: string) => {
    setDraftEmoji(emoji);
    setDraftFile(null);
    if (draftPreviewUrl) URL.revokeObjectURL(draftPreviewUrl);
    setDraftPreviewUrl(null);
    setProfileError(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!fileInputRef.current) return;
    fileInputRef.current.value = "";
    if (!file) return;

    if (!ALLOWED_EXTENSIONS[file.type]) {
      setProfileError("jpg, png, webp 형식만 업로드 가능합니다.");
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setProfileError(`파일 크기는 ${MAX_SIZE_MB}MB 이하만 가능합니다.`);
      return;
    }

    setProfileError(null);
    const objectUrl = URL.createObjectURL(file);
    setCropSrc(objectUrl);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleCropConfirm = async () => {
    if (!cropSrc || !croppedAreaPixels) return;
    setCropLoading(true);
    await new Promise((resolve) => requestAnimationFrame(resolve));
    try {
      const croppedFile = await getCroppedFile(cropSrc, croppedAreaPixels);
      if (draftPreviewUrl) URL.revokeObjectURL(draftPreviewUrl);
      const newPreviewUrl = URL.createObjectURL(croppedFile);
      setDraftFile(croppedFile);
      setDraftEmoji(null);
      setDraftPreviewUrl(newPreviewUrl);
      URL.revokeObjectURL(cropSrc);
      setCropSrc(null);
    } finally {
      setCropLoading(false);
    }
  };

  const handleCropCancel = () => {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
  };

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

  const closeWithdrawModal = () => {
    setWithdrawClosing(true);
    setTimeout(() => {
      setShowWithdrawConfirm(false);
      setWithdrawClosing(false);
      setWithdrawPassword("");
      setWithdrawPasswordError(null);
    }, 250);
  };

  const closeIntegrateSheet = () => {
    setIntegrateClosing(true);
    setTimeout(() => {
      setShowIntegrateSheet(false);
      setIntegrateClosing(false);
      setIntegratePassword("");
      setIntegrateConfirm("");
      setIntegrateError(null);
    }, 250);
  };

  const handleIntegrate = async () => {
    if (!integratePassword) { setIntegrateError("비밀번호를 입력해주세요."); return; }
    if (integratePassword !== integrateConfirm) { setIntegrateError("비밀번호가 일치하지 않습니다."); return; }
    setIntegrateError(null);
    setIntegrateLoading(true);
    try {
      await userApi.integrate(integratePassword);
      await refreshUser();
      closeIntegrateSheet();
    } catch (err) {
      setIntegrateError(err instanceof ApiException ? err.message : "전환 중 오류가 발생했습니다.");
    } finally {
      setIntegrateLoading(false);
    }
  };

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

      if (pendingRemove) {
        await userApi.updateProfile(null);
      } else if (pendingEmoji) {
        await userApi.updateProfile(pendingEmoji);
      } else if (pendingFile) {
        const { presignedUrl, s3Url } = await userApi.getPresignedUrl("jpg");
        await userApi.uploadToS3(presignedUrl, pendingFile);
        await userApi.updateProfile(s3Url);
        if (pendingPreviewUrl) URL.revokeObjectURL(pendingPreviewUrl);
        setPendingPreviewUrl(null);
        setPendingFile(null);
      }

      await refreshUser();
      setPendingEmoji(null);
      setPendingRemove(false);
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
    if (!isSocialUser && !withdrawPassword) {
      setWithdrawPasswordError("비밀번호를 입력해주세요.");
      return;
    }
    setWithdrawPasswordError(null);
    setWithdrawLoading(true);
    try {
      await userApi.deleteAccount(isSocialUser ? undefined : withdrawPassword);
      await logout();
      router.replace("/auth/login");
    } catch (err) {
      setWithdrawPasswordError(err instanceof ApiException ? err.message : "탈퇴 처리 중 오류가 발생했습니다.");
    } finally {
      setWithdrawLoading(false);
    }
  };

  const displayProfile = pendingRemove ? null
    : pendingPreviewUrl ?? pendingEmoji ?? user?.profile ?? null;
  const isDisplayImage = typeof displayProfile === "string" && displayProfile.startsWith("https://");
  const hasPendingChange = pendingRemove || !!pendingEmoji || !!pendingFile;
  const hasDraftSelection = !!draftEmoji || !!draftFile;

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

          <div className={styles.profileSection}>
            <button className={styles.avatarWrapper} onClick={openProfileSheet}>
              <div className={[styles.avatar, hasPendingChange ? styles.avatarPending : ""].join(" ")}>
                {pendingPreviewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={pendingPreviewUrl} alt="프로필" className={styles.avatarImg} />
                ) : isDisplayImage ? (
                  <Image src={displayProfile!} alt="프로필" width={80} height={80} className={styles.avatarImg} />
                ) : displayProfile ? (
                  <span className={styles.avatarEmoji}>{displayProfile}</span>
                ) : (
                  <RiCameraLine size={28} color="var(--color-text-muted)" />
                )}
              </div>
              <span className={styles.avatarEditBadge}>
                <RiCameraLine size={12} />
              </span>
            </button>
            {hasPendingChange
              ? <span className={styles.pendingHint}>저장하기를 눌러야 적용됩니다</span>
              : <span className={styles.avatarHint}>프로필을 눌러 변경하세요</span>
            }
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>이메일</label>
            <div className={styles.emailBox}>
              <span className={styles.emailValue}>{user?.email}</span>
            </div>
          </div>

          {user?.oauthProvider && (
            <div className={styles.fieldGroup}>
              <label className={styles.label}>연동된 소셜 계정</label>
              <div className={styles.linkedAccount}>
                <div className={styles.linkedAccountIcon} data-provider={user.oauthProvider}>
                  {user.oauthProvider === "GOOGLE"
                    ? <RiGoogleLine size={16} />
                    : <RiKakaoTalkFill size={16} />}
                </div>
                <span className={styles.linkedAccountName}>
                  {user.oauthProvider === "GOOGLE" ? "Google" : "카카오"}
                </span>
                <span className={styles.linkedAccountBadge}>
                  <RiLinkM size={12} />
                  연동됨
                </span>
              </div>
            </div>
          )}

          <div className={styles.fieldGroup}>
            <label className={styles.label}>이름</label>
            <input className={styles.input} value={name} onChange={(e) => setName(e.target.value)} placeholder="홍길동" disabled={loading} />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>닉네임</label>
            <input className={styles.input} value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="닉네임을 입력하세요" disabled={loading} />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>전화번호</label>
            <input className={styles.input} type="tel" value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} placeholder="010-1234-5678" disabled={loading} />
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
            {isSocialUser && (
              <Button variant="secondary" size="lg" fullWidth onClick={() => setShowIntegrateSheet(true)}>
                통합 회원 전환
              </Button>
            )}
            <Button variant="primary" size="lg" fullWidth onClick={handleSave} disabled={loading}>
              {loading ? <RiLoaderLine size={18} className={styles.spinner} /> : "저장하기"}
            </Button>
          </div>
        </div>
      </div>

      {/* 크롭 오버레이 */}
      {cropSrc && (
        <div className={styles.cropOverlay}>
          <div className={styles.cropHeader}>
            <button className={styles.cropCancelBtn} onClick={handleCropCancel}>취소</button>
            <span className={styles.cropTitle}>사진 편집</span>
            <button className={styles.cropConfirmBtn} onClick={handleCropConfirm} disabled={cropLoading}>
              {cropLoading ? <RiLoaderLine size={18} className={styles.spinner} /> : "완료"}
            </button>
          </div>
          <div className={styles.cropArea}>
            <Cropper
              image={cropSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>
          <div className={styles.cropFooter}>
            <span className={styles.cropZoomLabel}>축소</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className={styles.cropZoomSlider}
            />
            <span className={styles.cropZoomLabel}>확대</span>
          </div>
        </div>
      )}

      {/* 프로필 설정 바텀시트 */}
      <BottomSheet open={showProfileSheet} closing={profileClosing} onClose={closeProfileSheet} title="프로필 설정">
        <div className={styles.tabs}>
          <button
            className={[styles.tab, profileTab === "emoji" ? styles.tabActive : ""].join(" ")}
            onClick={() => { setProfileTab("emoji"); setProfileError(null); }}
          >
            이모지 선택
          </button>
          <button
            className={[styles.tab, profileTab === "image" ? styles.tabActive : ""].join(" ")}
            onClick={() => { setProfileTab("image"); setProfileError(null); }}
          >
            이미지 업로드
          </button>
        </div>

        {profileError && <p className={styles.errorBox}>{profileError}</p>}

        {(draftEmoji || draftPreviewUrl) && (
          <div className={styles.previewSection}>
            <div className={styles.previewAvatar}>
              {draftPreviewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={draftPreviewUrl} alt="미리보기" className={styles.previewImg} />
              ) : (
                <span className={styles.previewEmoji}>{draftEmoji}</span>
              )}
            </div>
            <span className={styles.previewLabel}>선택됨</span>
          </div>
        )}

        {profileTab === "emoji" && (
          <div className={styles.emojiGrid}>
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                className={[styles.emojiBtn, draftEmoji === emoji ? styles.emojiBtnSelected : ""].join(" ")}
                onClick={() => handleDraftSelectEmoji(emoji)}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {profileTab === "image" && (
          <div className={styles.imageTab}>
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              className={styles.fileInput}
              onChange={handleFileChange}
            />
            {!draftPreviewUrl ? (
              <button className={styles.uploadArea} onClick={() => fileInputRef.current?.click()}>
                <RiUploadCloud2Line size={36} color="var(--color-text-muted)" />
                <span className={styles.uploadLabel}>사진을 선택하세요</span>
                <span className={styles.uploadHint}>
                  jpg · png · webp · 최대 5MB{"\n"}권장 사이즈 500 × 500px
                </span>
              </button>
            ) : (
              <button className={styles.reSelectBtn} onClick={() => fileInputRef.current?.click()}>
                <RiImageLine size={14} />
                다른 사진 선택
              </button>
            )}
          </div>
        )}

        <Button variant="primary" size="lg" fullWidth onClick={handleProfileConfirm} disabled={!hasDraftSelection}>
          확인
        </Button>

        {(user?.profile || hasPendingChange) && (
          <button
            className={styles.removeProfileBtn}
            onClick={() => {
              setPendingRemove(true);
              setPendingEmoji(null);
              setPendingFile(null);
              if (pendingPreviewUrl) URL.revokeObjectURL(pendingPreviewUrl);
              setPendingPreviewUrl(null);
              closeProfileSheet();
            }}
          >
            프로필 제거
          </button>
        )}
      </BottomSheet>

      {/* 비밀번호 변경 */}
      <BottomSheet open={showPasswordModal} closing={passwordClosing} onClose={closePasswordModal} title="비밀번호 변경">
        {passwordError && <p className={styles.errorBox}>{passwordError}</p>}
        {passwordSuccess && (
          <div className={styles.successBox}>
            <RiCheckLine size={16} />
            변경되었습니다
          </div>
        )}
        <div className={styles.fieldGroup}>
          <label className={styles.label}>현재 비밀번호</label>
          <input className={styles.input} type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="현재 비밀번호" disabled={passwordLoading} />
        </div>
        <div className={styles.fieldGroup}>
          <label className={styles.label}>새 비밀번호</label>
          <input className={styles.input} type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="8자 이상, 영문/숫자/특수문자 포함" disabled={passwordLoading} />
        </div>
        <div className={styles.fieldGroup}>
          <label className={styles.label}>새 비밀번호 확인</label>
          <input className={styles.input} type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="새 비밀번호를 다시 입력하세요" disabled={passwordLoading} />
        </div>
        <div className={styles.modalActions}>
          <Button variant="secondary" size="lg" fullWidth onClick={closePasswordModal}>취소</Button>
          <Button variant="primary" size="lg" fullWidth onClick={handlePasswordChange} disabled={passwordLoading || !currentPassword || !newPassword || !confirmPassword}>
            {passwordLoading ? <RiLoaderLine size={18} className={styles.spinner} /> : "변경하기"}
          </Button>
        </div>
      </BottomSheet>

      {/* 통합 회원 전환 */}
      <BottomSheet open={showIntegrateSheet} closing={integrateClosing} onClose={closeIntegrateSheet} title="통합 회원으로 전환">
        <p className={styles.modalDesc}>비밀번호를 설정하면 이메일로도 로그인할 수 있어요.</p>
        <div className={styles.fieldGroupSm}>
          <input
            className={styles.input}
            type="password"
            placeholder="새 비밀번호 (8~20자, 영문·숫자·특수문자 포함)"
            value={integratePassword}
            onChange={(e) => { setIntegratePassword(e.target.value); setIntegrateError(null); }}
            disabled={integrateLoading}
            autoComplete="new-password"
          />
          <input
            className={styles.input}
            type="password"
            placeholder="비밀번호 확인"
            value={integrateConfirm}
            onChange={(e) => { setIntegrateConfirm(e.target.value); setIntegrateError(null); }}
            disabled={integrateLoading}
            autoComplete="new-password"
          />
          {integrateError && <p className={styles.errorBox}>{integrateError}</p>}
        </div>
        <div className={styles.modalActions}>
          <Button variant="secondary" size="lg" fullWidth onClick={closeIntegrateSheet} disabled={integrateLoading}>취소</Button>
          <Button variant="primary" size="lg" fullWidth onClick={handleIntegrate} disabled={integrateLoading}>
            {integrateLoading ? <RiLoaderLine size={18} className={styles.spinner} /> : "전환하기"}
          </Button>
        </div>
      </BottomSheet>

      {/* 탈퇴 확인 */}
      <BottomSheet open={showWithdrawConfirm} closing={withdrawClosing} onClose={closeWithdrawModal} title="정말 탈퇴하시겠어요?">
        <p className={styles.modalDesc}>탈퇴 시 모든 데이터가 삭제되며 복구할 수 없습니다.</p>
        {!isSocialUser && (
          <div className={styles.fieldGroupSm}>
            <input
              className={styles.input}
              type="password"
              placeholder="비밀번호 입력"
              value={withdrawPassword}
              onChange={(e) => { setWithdrawPassword(e.target.value); setWithdrawPasswordError(null); }}
              disabled={withdrawLoading}
              autoComplete="current-password"
            />
            {withdrawPasswordError && <p className={styles.errorBox}>{withdrawPasswordError}</p>}
          </div>
        )}
        <div className={styles.modalActions}>
          <Button variant="secondary" size="lg" fullWidth onClick={closeWithdrawModal} disabled={withdrawLoading}>취소</Button>
          <Button variant="danger" size="lg" fullWidth onClick={handleWithdraw} disabled={withdrawLoading}>
            {withdrawLoading ? <RiLoaderLine size={18} className={styles.spinner} /> : "탈퇴하기"}
          </Button>
        </div>
      </BottomSheet>
    </>
  );
}
