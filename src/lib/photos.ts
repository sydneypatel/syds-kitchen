import { supabase } from "./backend";

const BUCKET = "recipe-photos";

/** Shrinks a phone photo to ~1200px JPEG (a few hundred KB) before uploading. */
async function shrink(file: File, max = 1200, quality = 0.82): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("Couldn't read that photo. Try a JPEG or PNG."));
      i.src = url;
    });
    const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Couldn't process that photo."))), "image/jpeg", quality));
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Uploads a photo for a recipe and returns its URL. Local mode keeps it in the browser instead. */
export async function uploadRecipePhoto(recipeId: string, file: File): Promise<string> {
  const blob = await shrink(file);
  if (!supabase) {
    return await new Promise<string>((resolve) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.readAsDataURL(blob);
    });
  }
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) throw new Error("Sign in again to add photos.");
  const path = `${userId}/${recipeId}-${Date.now()}.jpg`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: "image/jpeg", upsert: false });
  if (error) throw new Error(/bucket not found|not found/i.test(error.message) ? "Photo storage isn't set up yet. Run the recipe-photos SQL in Supabase." : error.message);
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}
