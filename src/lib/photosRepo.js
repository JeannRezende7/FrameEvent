import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase.js";

function photosCol(eventId) {
  return collection(db, "events", eventId, "photos");
}

export async function listPhotos(eventId) {
  const snap = await getDocs(query(photosCol(eventId), orderBy("createdAt", "desc")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function createPhoto(eventId, data) {
  const ref = await addDoc(photosCol(eventId), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function deletePhoto(eventId, photoId) {
  await deleteDoc(doc(db, "events", eventId, "photos", photoId));
}
