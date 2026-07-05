import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "./firebase.js";
import { generateEventCode } from "../utils/slug.js";

const eventsCol = collection(db, "events");

export async function listEvents() {
  const snap = await getDocs(query(eventsCol, orderBy("createdAt", "desc")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getEvent(eventId) {
  const snap = await getDoc(doc(db, "events", eventId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function getEventByCode(code) {
  const snap = await getDocs(query(eventsCol, where("code", "==", code)));
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() };
}

export async function createEvent(data) {
  let code = generateEventCode();
  // garante que o código não colide com nenhum evento existente
  while (await getEventByCode(code)) {
    code = generateEventCode();
  }
  const ref = await addDoc(eventsCol, {
    ...data,
    code,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateEvent(eventId, data) {
  await updateDoc(doc(db, "events", eventId), data);
}

export async function deleteEvent(eventId) {
  await deleteDoc(doc(db, "events", eventId));
}

// Não guardamos as fotos geradas — só um contador de uso por evento.
export async function incrementEventStat(eventId, field) {
  await updateDoc(doc(db, "events", eventId), { [field]: increment(1) });
}
