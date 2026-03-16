export async function computeReceiptSha256(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", arrayBuffer);

  return Array.from(new Uint8Array(digest))
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

type UploadReceiptResponse = {
  id: number;
  sha256: string;
  originalName: string;
  storedName: string;
};

export async function uploadReceipt(file: File, sha256: string) {
  const formData = new FormData();
  formData.append("receipt", file);
  formData.append("sha256", sha256);

  const response = await fetch("/api/receipts", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;
    throw new Error(body?.error ?? "Receipt upload failed.");
  }

  return (await response.json()) as UploadReceiptResponse;
}
