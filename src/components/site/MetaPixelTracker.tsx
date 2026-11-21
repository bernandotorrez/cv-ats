import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import {
  META_PIXEL_ENABLED,
  captureAttribution,
  shouldTrackPageView,
  trackMeta,
  trackMetaRegistrationOnce,
  viewContentFor,
} from "@/lib/meta-pixel";

/**
 * Menyimpan atribusi iklan (UTM/fbclid) dan mengirim PageView, ViewContent, serta
 * CompleteRegistration ke Meta Pixel. No-op untuk Pixel bila VITE_META_PIXEL_ID kosong.
 */
export function MetaPixelTracker() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, loading } = useAuth();

  useEffect(() => {
    captureAttribution();
  }, []);

  useEffect(() => {
    if (!META_PIXEL_ENABLED || !shouldTrackPageView(pathname)) return;
    trackMeta("PageView");
    const content = viewContentFor(pathname);
    if (content) trackMeta("ViewContent", content);
  }, [pathname]);

  const userId = user?.id;
  const createdAt = user?.created_at;
  useEffect(() => {
    if (loading || !userId) return;
    trackMetaRegistrationOnce(userId, createdAt);
  }, [loading, userId, createdAt]);

  return null;
}
