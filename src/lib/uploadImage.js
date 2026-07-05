import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "./firebase.js";
import { v4 as uuid } from "uuid";

export async function uploadImage(file, path) {
  const ext = file.name?.split(".").pop() || "png";
  const fileRef = ref(storage, `${path}/${uuid()}.${ext}`);
  await uploadBytes(fileRef, file);
  return getDownloadURL(fileRef);
}

export async function uploadDataUrl(dataUrl, path) {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const fileRef = ref(storage, `${path}/${uuid()}.png`);
  await uploadBytes(fileRef, blob);
  return getDownloadURL(fileRef);
}
