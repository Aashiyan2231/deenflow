import { useState, useEffect } from "react";
import { db } from "../firebase";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";

const XP_THRESHOLDS = [0, 100, 250, 500, 900, 1400, 2000, 2700];

function calculateLevel(xp) {
  let level = 1;
  for (let i = 0; i < XP_THRESHOLDS.length; i++) {
    if (xp >= XP_THRESHOLDS[i]) level = i + 1;
  }
  return Math.min(level, 8);
}

export function useUser() {
  const { user } = useAuth();
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = onSnapshot(doc(db, "users", user.uid), (snap) => {
      if (snap.exists()) {
        setUserData(snap.data());
      }
    });
    return unsubscribe;
  }, [user]);

  const addXP = async (amount) => {
    if (!user || !userData) return;
    const newXP = Math.max(0, (userData.xp || 0) + amount);
    const newLevel = calculateLevel(newXP);
    await updateDoc(doc(db, "users", user.uid), {
      xp: newXP,
      level: newLevel,
    });
  };

  return { userData, addXP };
}