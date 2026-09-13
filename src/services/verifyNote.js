import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "../firebase";

const functions = getFunctions(app);
const verifyNoteCallable = httpsCallable(functions, "verifyNote");

export async function verifyNote({ videoTitle, userNote }) {
  const result = await verifyNoteCallable({ videoTitle, userNote });
  const { verdict, reason } = result.data || {};

  return { verdict, reason };
}

export default verifyNote;
