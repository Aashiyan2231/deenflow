import { db } from "../firebase";
import {
  doc, setDoc, getDoc, updateDoc,
  arrayUnion, arrayRemove, collection,
  query, where, getDocs, addDoc, serverTimestamp,
  orderBy, limit
} from "firebase/firestore";

// ── USER ──
export async function createUserIfNotExists(user) {
  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) {
    const friendCode = user.uid.slice(0, 8).toUpperCase();
    await setDoc(userRef, {
      name: user.displayName,
      email: user.email,
      photo: user.photoURL,
      xp: 0,
      level: 1,
      streak: 0,
      friendCode,
      friends: [],
      sentRequests: [],
      receivedRequests: [],
      groups: [],
      createdAt: serverTimestamp(),
    });
  }
}

// ── FRIEND SYSTEM ──
export async function sendFriendRequest(currentUser, friendCode) {
  const q = query(collection(db, "users"), where("friendCode", "==", friendCode.toUpperCase()));
  const snap = await getDocs(q);
  if (snap.empty) return { error: "No player found with this code!" };
  const friendDoc = snap.docs[0];
  const friendId = friendDoc.id;
  const friendData = friendDoc.data();
  if (friendId === currentUser.uid) return { error: "You can't add yourself!" };
  if (friendData.friends?.includes(currentUser.uid)) return { error: "Already friends!" };
  if (friendData.receivedRequests?.includes(currentUser.uid)) return { error: "Request already sent!" };
  await updateDoc(doc(db, "users", friendId), { receivedRequests: arrayUnion(currentUser.uid) });
  await updateDoc(doc(db, "users", currentUser.uid), { sentRequests: arrayUnion(friendId) });
  return { success: `Friend request sent to ${friendData.name}!` };
}

export async function acceptFriendRequest(currentUserId, friendId) {
  await updateDoc(doc(db, "users", currentUserId), {
    friends: arrayUnion(friendId),
    receivedRequests: arrayRemove(friendId),
  });
  await updateDoc(doc(db, "users", friendId), {
    friends: arrayUnion(currentUserId),
    sentRequests: arrayRemove(currentUserId),
  });
}

export async function declineFriendRequest(currentUserId, friendId) {
  await updateDoc(doc(db, "users", currentUserId), { receivedRequests: arrayRemove(friendId) });
  await updateDoc(doc(db, "users", friendId), { sentRequests: arrayRemove(currentUserId) });
}

export async function getUserById(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  if (snap.exists()) return { id: snap.id, ...snap.data() };
  return null;
}

// ── GROUP SYSTEM ──
function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export async function createGroup(user, groupName, subject) {
  let inviteCode;
  let codeExists = true;
  while (codeExists) {
    inviteCode = generateCode();
    const q = query(collection(db, "groups"), where("inviteCode", "==", inviteCode));
    const snap = await getDocs(q);
    codeExists = !snap.empty;
  }

  const groupRef = await addDoc(collection(db, "groups"), {
    name: groupName,
    subject,
    inviteCode,
    adminId: user.uid,
    adminName: user.displayName,
    members: [user.uid],
    missions: { deen: [], duniya: [], health: [] },
    status: "waiting",
    createdAt: serverTimestamp(),
    startDate: null,
    lastVoiceNote: null, // tracks latest voice note for NEW badge
  });

  await updateDoc(doc(db, "users", user.uid), {
    groups: arrayUnion(groupRef.id),
  });

  return { success: true, groupId: groupRef.id, inviteCode };
}

export async function joinGroup(user, inviteCode) {
  const q = query(collection(db, "groups"), where("inviteCode", "==", inviteCode.toUpperCase()));
  const snap = await getDocs(q);
  if (snap.empty) return { error: "Invalid invite code!" };

  const groupDoc = snap.docs[0];
  const groupId = groupDoc.id;
  const groupData = groupDoc.data();

  if (groupData.members.includes(user.uid)) return { error: "You are already in this group!" };
  if (groupData.status === "ended") return { error: "This challenge has already ended!" };

  await updateDoc(doc(db, "groups", groupId), {
    members: arrayUnion(user.uid),
  });

  await updateDoc(doc(db, "users", user.uid), {
    groups: arrayUnion(groupId),
  });

  return { success: true, groupId, groupName: groupData.name };
}

export async function getGroupById(groupId) {
  const snap = await getDoc(doc(db, "groups", groupId));
  if (snap.exists()) return { id: snap.id, ...snap.data() };
  return null;
}

export async function addMissionToGroup(groupId, category, mission) {
  const groupRef = doc(db, "groups", groupId);
  const groupSnap = await getDoc(groupRef);
  if (!groupSnap.exists()) return { error: "Group not found!" };

  const missions = groupSnap.data().missions || { deen: [], duniya: [], health: [] };
  const updatedCategory = [...(missions[category] || []), {
    id: Date.now().toString(),
    title: mission.title,
    xp: mission.xp,
    category,
  }];

  await updateDoc(groupRef, {
    [`missions.${category}`]: updatedCategory,
  });

  return { success: true };
}

export async function removeMissionFromGroup(groupId, category, missionId) {
  const groupRef = doc(db, "groups", groupId);
  const groupSnap = await getDoc(groupRef);
  if (!groupSnap.exists()) return;

  const missions = groupSnap.data().missions || { deen: [], duniya: [], health: [] };
  const updated = (missions[category] || []).filter(m => m.id !== missionId);

  await updateDoc(groupRef, {
    [`missions.${category}`]: updated,
  });
}

export async function startChallenge(groupId) {
  await updateDoc(doc(db, "groups", groupId), {
    status: "active",
    startDate: serverTimestamp(),
  });
}

// ── VOICE NOTES ──

// Save voice note metadata to Firestore after upload
export async function saveVoiceNote(groupId, adminId, adminName, downloadURL, durationSec) {
  const noteRef = await addDoc(collection(db, "groups", groupId, "voiceNotes"), {
    adminId,
    adminName,
    url: downloadURL,
    duration: durationSec,
    createdAt: serverTimestamp(),
  });

  // Update group doc so members can detect new voice note
  await updateDoc(doc(db, "groups", groupId), {
    lastVoiceNote: {
      id: noteRef.id,
      url: downloadURL,
      adminName,
      createdAt: new Date().toISOString(),
    },
  });

  return { success: true, id: noteRef.id };
}

// Get last 5 voice notes for a group
export async function getVoiceNotes(groupId) {
  const q = query(
    collection(db, "groups", groupId, "voiceNotes"),
    orderBy("createdAt", "desc"),
    limit(5)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// Mark voice note as heard by user (stores in localStorage for simplicity)
export function markVoiceNoteHeard(groupId, noteId) {
  const key = `heard_${groupId}_${noteId}`;
  localStorage.setItem(key, "true");
}

export function hasHeardVoiceNote(groupId, noteId) {
  const key = `heard_${groupId}_${noteId}`;
  return localStorage.getItem(key) === "true";
}
// ── GROUP CHAT ──
export async function sendMessage(groupId, user, text, imageURL = null, replyTo = null) {
  await addDoc(collection(db, "groups", groupId, "messages"), {
    text: text || null,
    imageURL: imageURL || null,
    senderId: user.uid,
    senderName: user.displayName,
    senderPhoto: user.photoURL,
    replyTo: replyTo || null,
    reactions: {},
    createdAt: serverTimestamp(),
  });
}

export async function addReaction(groupId, messageId, userId, emoji) {
  const msgRef = doc(db, "groups", groupId, "messages", messageId);
  const snap = await getDoc(msgRef);
  if (!snap.exists()) return;
  const reactions = snap.data().reactions || {};
  const current = reactions[emoji] || [];
  const updated = current.includes(userId)
    ? current.filter(id => id !== userId)
    : [...current, userId];
  await updateDoc(msgRef, { [`reactions.${emoji}`]: updated });
}
