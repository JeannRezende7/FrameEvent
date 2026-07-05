import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "./firebase.js";

function framesCol(eventId) {
  return collection(db, "events", eventId, "frames");
}

export async function listFrames(eventId, { onlyActive = false } = {}) {
  const snap = await getDocs(query(framesCol(eventId), orderBy("order", "asc")));
  const frames = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return onlyActive ? frames.filter((f) => f.active) : frames;
}

export async function createFrame(eventId, data) {
  const ref = await addDoc(framesCol(eventId), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateFrame(eventId, frameId, data) {
  await updateDoc(doc(db, "events", eventId, "frames", frameId), data);
}

export async function deleteFrame(eventId, frameId) {
  await deleteDoc(doc(db, "events", eventId, "frames", frameId));
}
