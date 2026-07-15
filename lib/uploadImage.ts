export async function uploadProductImage(
  file: File
): Promise<{ url: string; key: string }> {
  const presignRes = await fetch("/api/upload/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fileName: file.name, contentType: file.type }),
  });

  if (!presignRes.ok) {
    throw new Error("Failed to get upload URL");
  }

  const { uploadUrl, key, publicUrl } = await presignRes.json();

  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });

  if (!uploadRes.ok) {
    throw new Error("Failed to upload image");
  }

  return { url: publicUrl, key };
}

export async function deleteProductImage(key: string): Promise<void> {
  const res = await fetch("/api/upload/delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key }),
  });

  if (!res.ok) {
    throw new Error("Failed to delete image");
  }
}