import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { db, storage } from "../firebase";
import {
  collection, query, orderBy, onSnapshot,
  addDoc, serverTimestamp, doc, getDoc, updateDoc
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const EMOJIS = ["❤️", "😂", "🔥", "👍", "🤲", "💪"];

function timeAgo(ts) {
  if (!ts) return "";
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / 3600000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  return date.toLocaleDateString();
}
function MemberRow({ uid, adminId }) {
  const [member, setMember] = useState(null);
  useEffect(() => {
    getDoc(doc(db, "users", uid)).then(snap => {
      if (snap.exists()) setMember({ id: snap.id, ...snap.data() });
    });
  }, [uid]);

  if (!member) return null;
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "10px",
      padding: "8px 0", borderBottom: "1px solid #f8f8f8",
    }}>
      {member.photo
        ? <img src={member.photo} style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover" }} />
        : <div style={{
            width: "32px", height: "32px", borderRadius: "50%",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "white", fontSize: "13px", fontWeight: "900",
          }}>{member.name?.[0]}</div>
      }
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: "13px", fontWeight: "700", color: "#1e1b4b" }}>{member.name}</div>
        <div style={{ fontSize: "11px", color: "#94a3b8" }}>Level {member.level} · {member.xp} XP</div>
      </div>
      {uid === adminId && (
        <span style={{
          fontSize: "9px", color: "#6366f1", fontWeight: "700",
          background: "#eef2ff", padding: "2px 8px", borderRadius: "100px",
          border: "1px solid rgba(99,102,241,0.2)",
        }}>ADMIN</span>
      )}
    </div>
  );
}

function Chat() {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [reactingTo, setReactingTo] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const bottomRef = useRef(null);
  const fileRef = useRef(null);
  const inputRef = useRef(null);
  const [showMembers, setShowMembers] = useState(false);

  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, "users", user.uid)).then(async snap => {
      if (!snap.exists()) return;
      const groupIds = snap.data().groups || [];
      const groupData = await Promise.all(
        groupIds.map(async id => {
          const g = await getDoc(doc(db, "groups", id));
          return g.exists() ? { id: g.id, ...g.data() } : null;
        })
      );
      const valid = groupData.filter(Boolean);
      setGroups(valid);
      if (valid.length > 0) { setSelectedGroup(valid[0]); setShowSidebar(false); }
    });
  }, [user]);

  useEffect(() => {
    if (!selectedGroup) return;
    const q = query(collection(db, "groups", selectedGroup.id, "messages"), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });
    return unsub;
  }, [selectedGroup]);

  const handleSend = async () => {
    if ((!text.trim() && !imageFile) || sending) return;
    setSending(true);
    try {
      let imageURL = null;
      if (imageFile) {
        setUploading(true);
        const storageRef = ref(storage, `chat_images/${selectedGroup.id}/${Date.now()}`);
        await uploadBytes(storageRef, imageFile);
        imageURL = await getDownloadURL(storageRef);
        setUploading(false);
        setImagePreview(null);
        setImageFile(null);
      }
      await addDoc(collection(db, "groups", selectedGroup.id, "messages"), {
        text: text.trim() || null,
        imageURL: imageURL || null,
        senderId: user.uid,
        senderName: user.displayName,
        senderPhoto: user.photoURL,
        replyTo: replyTo || null,
        reactions: {},
        createdAt: serverTimestamp(),
      });
      setText("");
      setReplyTo(null);
      inputRef.current?.focus();
    } catch (e) { console.error(e); }
    setSending(false);
  };

  const handleReact = async (msgId, emoji) => {
    const msgRef = doc(db, "groups", selectedGroup.id, "messages", msgId);
    const snap = await getDoc(msgRef);
    if (!snap.exists()) return;
    const reactions = snap.data().reactions || {};
    const current = reactions[emoji] || [];
    const updated = current.includes(user.uid) ? current.filter(id => id !== user.uid) : [...current, user.uid];
    await updateDoc(msgRef, { [`reactions.${emoji}`]: updated });
    setReactingTo(null);
  };

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const selectGroup = (g) => {
    setSelectedGroup(g);
    setShowSidebar(false);
    setMessages([]);
  };

  const isMine = (msg) => msg.senderId === user.uid;

  // SIDEBAR VIEW
  const SidebarView = (
    <div style={{
      position: "fixed", top: 112, left: 0, right: 0, bottom: 65,
      background: "#fff", overflowY: "auto", zIndex: 5,
      display: showSidebar ? "block" : "none",
    }}>
      <div style={{ padding: "16px", borderBottom: "1px solid #f0f0f0" }}>
        <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#1e1b4b", fontFamily: "'Orbitron', monospace" }}>
          💬 Group Chats
        </h2>
      </div>
      {groups.length === 0 && (
        <div style={{ padding: "40px 20px", textAlign: "center", color: "#94a3b8", fontSize: "14px" }}>
          You're not in any groups yet.<br />Join a group to start chatting!
        </div>
      )}
      {groups.map(g => (
        <div key={g.id} onClick={() => selectGroup(g)} style={{
          display: "flex", alignItems: "center", gap: "14px",
          padding: "14px 16px", borderBottom: "1px solid #f8f8f8",
          cursor: "pointer", background: selectedGroup?.id === g.id ? "#f0f4ff" : "white",
          transition: "background 0.15s",
        }}>
          <div style={{
            width: "50px", height: "50px", borderRadius: "50%", flexShrink: 0,
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "white", fontWeight: "900", fontSize: "20px",
          }}>
            {g.name?.[0]?.toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "15px", fontWeight: "700", color: "#1e1b4b" }}>{g.name}</div>
            <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>
              {g.members?.length} members · {g.subject}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // CHAT VIEW
const ChatView = (
  <div style={{
    position: "fixed", top: 112, left: 0, right: 0, bottom: 80,
    display: !showSidebar && selectedGroup ? "flex" : "none",
    flexDirection: "column", background: "#EEF2FF",
    zIndex: 5,
  }}>
    {/* Chat Header */}
    <div style={{
      display: "flex", alignItems: "center", gap: "12px",
      padding: "10px 14px", background: "#6366f1", flexShrink: 0,
    }}>
      {/* ← Back button */}
      <button onClick={() => setShowSidebar(true)} style={{
        width: "32px", height: "32px", borderRadius: "50%",
        background: "rgba(255,255,255,0.2)", border: "none",
        color: "white", fontSize: "16px", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>←</button>

      <div style={{
        width: "36px", height: "36px", borderRadius: "50%",
        background: "rgba(255,255,255,0.25)",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "white", fontWeight: "900", fontSize: "15px",
      }}>
        {selectedGroup?.name?.[0]?.toUpperCase()}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: "14px", fontWeight: "800", color: "white" }}>{selectedGroup?.name}</div>
        <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.75)" }}>{selectedGroup?.members?.length} members</div>
      </div>
      <button onClick={() => setShowMembers(!showMembers)} style={{
        background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)",
        borderRadius: "10px", padding: "6px 12px", color: "white",
        fontSize: "12px", fontWeight: "700", cursor: "pointer",
        display: "flex", alignItems: "center", gap: "6px",
      }}>
        👥 Members
      </button>
    </div>

    {/* Members Dropdown */}
    {showMembers && (
      <div style={{
        background: "white", borderBottom: "1px solid #e0e7ff",
        padding: "12px 16px", flexShrink: 0,
        maxHeight: "200px", overflowY: "auto",
      }}>
        <div style={{ fontSize: "10px", color: "#94a3b8", fontWeight: "700", letterSpacing: "2px", marginBottom: "10px" }}>
          GROUP MEMBERS
        </div>
        {selectedGroup?.members?.map((uid) => (
          <MemberRow key={uid} uid={uid} adminId={selectedGroup.adminId} />
        ))}
      </div>
    )}

    {/* ... rest of ChatView (messages, input, etc.) */}
      

      {/* Messages Area */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column" ,gap:"10px"}}>
        {messages.length === 0 && (
          <div style={{ textAlign: "center", margin: "auto", color: "#94a3b8", fontSize: "13px", padding: "20px" }}>
            No messages yet. Say Salaam! 👋
          </div>
        )}
        {messages.map((msg, i) => {
          const mine = isMine(msg);
          const showName = !mine && (i === 0 || messages[i - 1]?.senderId !== msg.senderId);
          return (
            <div key={msg.id} style={{
              display: "flex", flexDirection: mine ? "row-reverse" : "row",
              alignItems: "flex-end", gap: "6px",
              marginBottom: "4px",
              marginTop: showName ? "10px" : "0",
            }}>
              {/* Avatar */}
              {!mine && (
                <div style={{ width: "28px", flexShrink: 0, alignSelf: "flex-end" }}>
                  {showName && (
                    msg.senderPhoto
                      ? <img src={msg.senderPhoto} style={{ width: "28px", height: "28px", borderRadius: "50%", objectFit: "cover" }} />
                      : <div style={{
                          width: "28px", height: "28px", borderRadius: "50%",
                          background: "#6366f1", display: "flex", alignItems: "center",
                          justifyContent: "center", color: "white", fontSize: "11px", fontWeight: "900",
                        }}>{msg.senderName?.[0]}</div>
                  )}
                </div>
              )}

              <div style={{ maxWidth: "85%", minWidth: "60px" }}>
                {showName && !mine && (
                  <div style={{ fontSize: "11px", color: "#6366f1", fontWeight: "700", marginBottom: "3px", paddingLeft: "2px" }}>
                    {msg.senderName?.split(" ")[0]}
                  </div>
                )}

                {/* Reply preview */}
                {msg.replyTo && (
                  <div style={{
                    background: mine ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.05)",
                    borderLeft: "3px solid rgba(99,102,241,0.6)",
                    borderRadius: "6px 6px 0 0", padding: "5px 10px",
                    fontSize: "11px", color: mine ? "rgba(255,255,255,0.8)" : "#64748b",
                    marginBottom: "-4px",
                    background: mine ? "rgba(90,80,200,0.5)" : "rgba(200,200,210,0.4)",
                  }}>
                    ↩ {msg.replyTo.senderName?.split(" ")[0]}: {msg.replyTo.text || "📷 Photo"}
                  </div>
                )}

              {/* Bubble */}
<div
  onClick={() =>
    setReactingTo(reactingTo === msg.id ? null : msg.id)
  }
  style={{
    background: mine ? "#1e1b4b" : "white",
color: mine ? "white" : "#1e1b4b",
    borderRadius: mine
      ? (msg.replyTo
          ? "12px 0px 0px 12px"
          : "18px 4px 18px 18px")
      : (msg.replyTo
          ? "0px 12px 12px 12px"
          : "4px 18px 18px 18px"),
    padding: msg.imageURL && !msg.text ? "4px" : "9px 13px",
    fontSize: "14px",
    lineHeight: "1.5",
    boxShadow: mine
      ? "0 2px 8px rgba(99,102,241,0.3)"
      : "0 1px 4px rgba(0,0,0,0.08)",
    cursor: "pointer",
    wordBreak: "break-word",
    maxWidth: "85%",
  }}
>
  {msg.imageURL && (
    <img
      src={msg.imageURL}
      alt="chat"
      style={{
        maxWidth: "100%",
        borderRadius: "10px",
        display: "block",
      }}
    />
  )}

  {msg.text && (
    <div>
      {msg.text}
    </div>
  )}

 <div
  style={{
    fontSize: "10px",
    opacity: 0.6,
    textAlign: "right",
    marginTop: "2px",
    color: mine ? "rgba(255,255,255,0.7)" : "#94a3b8",
  }}
>
    {msg.createdAt?.seconds
      ? new Date(
          msg.createdAt.seconds * 1000
        ).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : ""}
  </div>
</div>

                {/* Reactions */}
                {Object.entries(msg.reactions || {}).filter(([, u]) => u.length > 0).length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "3px", marginTop: "3px", justifyContent: mine ? "flex-end" : "flex-start" }}>
                    {Object.entries(msg.reactions || {}).filter(([, u]) => u.length > 0).map(([emoji, users]) => (
                      <button key={emoji} onClick={() => handleReact(msg.id, emoji)} style={{
                        background: users.includes(user.uid) ? "#eef2ff" : "white",
                        border: `1px solid ${users.includes(user.uid) ? "#6366f1" : "#e2e8f0"}`,
                        borderRadius: "100px", padding: "1px 7px",
                        fontSize: "12px", cursor: "pointer",
                      }}>
                        {emoji} <span style={{ fontSize: "10px", color: "#64748b" }}>{users.length}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Emoji Picker + Reply */}
                {reactingTo === msg.id && (
                  <div style={{
                    display: "flex", gap: "4px", marginTop: "5px", flexWrap: "wrap",
                    background: "white", borderRadius: "20px", padding: "6px 10px",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.12)", border: "1px solid #e0e7ff",
                    alignItems: "center",
                  }}>
                    {EMOJIS.map(e => (
                      <button key={e} onClick={() => handleReact(msg.id, e)} style={{
                        background: "none", border: "none", fontSize: "18px", cursor: "pointer", padding: "2px",
                      }}>{e}</button>
                    ))}
                    <div style={{ width: "1px", height: "20px", background: "#e2e8f0", margin: "0 4px" }} />
                    <button onClick={() => { setReplyTo({ id: msg.id, text: msg.text, senderName: msg.senderName }); setReactingTo(null); }} style={{
                      background: "none", border: "none", fontSize: "13px", cursor: "pointer", color: "#6366f1", fontWeight: "700",
                    }}>↩ Reply</button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Image Preview */}
      {imagePreview && (
        <div style={{
          padding: "8px 14px", background: "white", borderTop: "1px solid #e0e7ff",
          display: "flex", alignItems: "center", gap: "10px", flexShrink: 0,
        }}>
          <img src={imagePreview} style={{ height: "50px", borderRadius: "8px" }} />
          <button onClick={() => { setImagePreview(null); setImageFile(null); }} style={{
            background: "#fff1f2", border: "1px solid #fecdd3", borderRadius: "8px",
            color: "#ef4444", padding: "4px 10px", cursor: "pointer", fontSize: "12px", fontWeight: "700",
          }}>✕</button>
        </div>
      )}

      {/* Reply Preview */}
      {replyTo && (
        <div style={{
          padding: "8px 14px", background: "#f0f4ff", borderTop: "1px solid #e0e7ff",
          display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0,
        }}>
          <div style={{ fontSize: "12px", color: "#232437" }}>
            ↩ <strong>{replyTo.senderName?.split(" ")[0]}</strong>: {replyTo.text || "📷 Photo"}
          </div>
          <button onClick={() => setReplyTo(null)} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "16px" }}>✕</button>
        </div>
      )}

      {/* Input */}
      <div style={{
        padding: "8px 10px", background: "white",
        borderTop: "1px solid #e8e8e8",
        display: "flex", alignItems: "center", gap: "8px", flexShrink: 0,
      }}>
        <button onClick={() => fileRef.current?.click()} style={{
          width: "38px", height: "38px", borderRadius: "50%",
          background: "#f0f4ff", border: "none", cursor: "pointer",
          fontSize: "18px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>📷</button>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImage} />

        <input
          ref={inputRef}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
          placeholder="Message..."
          style={{
            flex: 1, padding: "10px 16px",
            background: "#f4f4f8", border: "none",
            borderRadius: "24px", fontSize: "14px", color: "#1e1b4b",
            outline: "none", fontFamily: "inherit",
          }}
        />

        <button onClick={handleSend} disabled={sending || uploading} style={{
          width: "38px", height: "38px", borderRadius: "50%", flexShrink: 0,
          background: (!text.trim() && !imageFile) ? "#e5e7eb" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
          border: "none", cursor: "pointer", color: "white",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px",
          boxShadow: (!text.trim() && !imageFile) ? "none" : "0 2px 8px rgba(99,102,241,0.4)",
          transition: "all 0.2s",
        }}>
          {sending || uploading ? "⏳" : "➤"}
        </button>
      </div>
    </div>
  );

  // No group selected fallback
  const EmptyView = (
    <div style={{
      position: "fixed", top: 60, left: 0, right: 0, bottom: 60,
      display: !showSidebar && !selectedGroup ? "flex" : "none",
      alignItems: "center", justifyContent: "center",
      background: "#EEF2FF", flexDirection: "column", gap: "12px",
    }}>
      <div style={{ fontSize: "48px" }}>💬</div>
      <p style={{ color: "#e1e5eb", fontSize: "14px" }}>Select a group to start chatting</p>
      <button onClick={() => setShowSidebar(true)} style={{
        padding: "10px 24px", background: "#161626", border: "none",
        borderRadius: "12px", color: "white", fontWeight: "700", cursor: "pointer",
      }}>View Groups</button>
    </div>
  );

  return (
    <>
      {SidebarView}
      {ChatView}
      {EmptyView}
    </>
  );
}

export default Chat;