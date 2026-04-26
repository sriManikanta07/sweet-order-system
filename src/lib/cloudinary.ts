// Cloudinary unsigned upload helper.
// Cloud name + unsigned preset are public values, safe to ship in the bundle.

const CLOUD_NAME = "dmoq714ep";
const UPLOAD_PRESET = "bakery_upload_01";
const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

export async function uploadToCloudinary(file: File, folder = "bakery/products"): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", UPLOAD_PRESET);
  form.append("folder", folder);

  const res = await fetch(UPLOAD_URL, { method: "POST", body: form });
  if (!res.ok) {
    let detail = "";
    try {
      const json = await res.json();
      detail = json?.error?.message ?? "";
    } catch {
      /* ignore */
    }
    throw new Error(detail || `Cloudinary upload failed (${res.status})`);
  }

  const json = (await res.json()) as { secure_url?: string };
  if (!json.secure_url) throw new Error("Cloudinary upload returned no URL");
  return json.secure_url;
}
