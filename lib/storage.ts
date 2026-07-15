export function getImageUrl(path?: string | null) {
  if (!path) {
    return "/placeholder.png";
  }

  // Already a full URL
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  // Remove accidental leading slash
  const cleanPath = path.replace(/^\/+/, "");

  return `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${cleanPath}`;
}