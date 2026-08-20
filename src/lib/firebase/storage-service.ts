import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./client";

export async function uploadScreenshot(
  userId: string,
  file: File,
  folder: "trades" | "journals" | "strategies" = "trades"
): Promise<string> {
  if (!storage) {
    // Return Object URL for preview fallback if Storage is not configured
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.readAsDataURL(file);
    });
  }

  const timestamp = Date.now();
  const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const path = `users/${userId}/${folder}/${timestamp}_${cleanName}`;
  const storageRef = ref(storage, path);

  const snapshot = await uploadBytes(storageRef, file, {
    contentType: file.type,
  });

  return await getDownloadURL(snapshot.ref);
}
