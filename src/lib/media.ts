import { supabase } from "@/integrations/supabase/client";

const MEDIA_MARKER = "/storage/v1/object/public/media/";

export function pathFromMediaUrl(url: string | null | undefined) {
  if (!url) return null;
  const index = url.indexOf(MEDIA_MARKER);
  if (index === -1) return null;
  return decodeURIComponent(url.slice(index + MEDIA_MARKER.length).split("?")[0]);
}

export async function getMediaDisplayUrl(mediaPath?: string | null, legacyUrl?: string | null) {
  const path = mediaPath || pathFromMediaUrl(legacyUrl);
  if (!path) return legacyUrl ?? null;

  const { data, error } = await supabase.storage.from("media").createSignedUrl(path, 60 * 60 * 12);
  if (error) return legacyUrl ?? null;
  return data.signedUrl;
}

export function formatFileSize(size?: number | null) {
  if (!size) return "—";
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}