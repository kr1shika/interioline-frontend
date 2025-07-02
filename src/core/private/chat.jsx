import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../provider/authcontext";
import "../style/ChatWidget.css";

export default function ChatWidget() {
  const [chatRooms, setChatRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [images, setImages] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const { userId, isLoggedIn, isUserIdAvailable, getToken } = useAuth();

  useEffect(() => {
    const fetchChatRooms = async () => {
      if (!isLoggedIn || !isUserIdAvailable()) {
        setChatRooms([]);
        return;
      }

      setLoading(true);
      try {
        const token = getToken();
        const config = {
          ...(token && {
            headers: { Authorization: `Bearer ${token}` }
          })
        };

        const res = await axios.get(`http://localhost:2005/api/project/user/${userId}`, config);
        setChatRooms(Array.isArray(res.data) ? res.data : []);
        console.log("✅ Chat rooms loaded:", res.data?.length || 0);
        setError("");
      } catch (err) {
        console.error("❌ Error fetching chat rooms:", err);

        if (err.response?.status === 401) {
          setError("Session expired. Please log in again.");
        } else {
          setError("Failed to load chat rooms.");
        }
        setChatRooms([]);
      } finally {
        setLoading(false);
      }
    };

    fetchChatRooms();
  }, [userId, isLoggedIn, isUserIdAvailable, getToken]);

  const openChatRoom = async (roomId) => {
    if (!isUserIdAvailable()) {
      setError("Authentication required to access chat.");
      return;
    }

    try {
      setSelectedRoomId(roomId);
      setLoading(true);

      const token = getToken();
      const config = {
        ...(token && {
          headers: { Authorization: `Bearer ${token}` }
        })
      };

      const res = await axios.get(`http://localhost:2005/api/chat/${roomId}`, config);
      setMessages(Array.isArray(res.data) ? res.data : []);
      setError("");

      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: "auto" });
        }
      }, 100);
    } catch (err) {
      console.error("❌ Error fetching messages:", err);

      if (err.response?.status === 401) {
        setError("Session expired. Please log in again.");
      } else {
        setError("Failed to load messages.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!text.trim() && images.length === 0) return;

    if (!isUserIdAvailable()) {
      setError("Authentication required to send messages.");
      return;
    }

    const firstMsg = messages.find((m) => m.senderId?._id || m.receiverId?._id);
    const receiverId =
      firstMsg?.senderId?._id?.toString() === userId
        ? firstMsg?.receiverId?._id
        : firstMsg?.senderId?._id;

    if (!receiverId) {
      setError("Unable to determine recipient.");
      return;
    }

    const formData = new FormData();
    formData.append("senderId", userId);
    formData.append("receiverId", receiverId);
    formData.append("text", text);
    images.forEach((img) => formData.append("attachments", img));

    try {
      setLoading(true);

      const token = getToken();
      const config = {
        headers: {
          "Content-Type": "multipart/form-data",
          ...(token && { Authorization: `Bearer ${token}` })
        },
      };

      const res = await axios.post(
        `http://localhost:2005/api/chat/${selectedRoomId}`,
        formData,
        config
      );

      setMessages((prev) => [...prev, res.data]);
      setText("");
      setImages([]);
      setError("");

      console.log("✅ Message sent successfully");
    } catch (err) {
      console.error("❌ Error sending message:", err);

      if (err.response?.status === 401) {
        setError("Session expired. Please log in again.");
      } else {
        setError("Failed to send message. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  if (!isLoggedIn || !isUserIdAvailable()) {
    return (
      <div className="chat-widget">
        <div className="chat-header">🔒 Authentication Required</div>
        <div style={{
          padding: '20px',
          textAlign: 'center',
          fontSize: '14px',
          color: '#666'
        }}>
          <p>Please log in to access chat features.</p>
        </div>
      </div>
    );
  }

  const currentRoom = chatRooms.find(r => r._id === selectedRoomId);

  return (
    <div className="chat-widget">
      {/* Header */}
      <div className="chat-header">
        {selectedRoomId ? (currentRoom?.title || "Project") : "Messages"}

      </div>

      {/* Error message */}
      {error && (
        <div style={{
          background: '#fee2e2',
          color: '#dc2626',
          padding: '8px 12px',
          fontSize: '12px',
          borderBottom: '1px solid #fecaca'
        }}>
          {error}
        </div>
      )}

      {!selectedRoomId ? (
        <div className="chat-room-list">
          {loading ? (
            <p style={{ textAlign: 'center', padding: '20px', color: '#C2805A' }}>
              Loading chat rooms...
            </p>
          ) : chatRooms.length === 0 ? (
            <p className="text-sm text-gray-500">No chat rooms found.</p>
          ) : (
            chatRooms.map((room) => (
              <div
                key={room._id}
                onClick={() => openChatRoom(room._id)}
                className="chat-room-card"
                style={{
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1
                }}
              >
                <div className="flex items-center">
                  <img src="/default-user.png" alt="User Avatar" />
                  <span>{room.title || "Untitled Project"}</span>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="flex flex-col flex-1" style={{ minHeight: 0 }}>
          {/* Back button */}
          <button
            onClick={() => setSelectedRoomId(null)}
            className="chat-back-button"
            disabled={loading}
          >
            ← Back to Rooms
          </button>

          {/* Content container: messages + input */}
          <div className="chat-content-container" style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
            <div className="chat-messages" style={{ flex: 1, overflowY: "auto" }}>
              {loading && messages.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '20px',
                  color: '#C2805A'
                }}>
                  Loading messages...
                </div>
              ) : (
                messages.map((msg) => {
                  const senderId = msg.senderId?._id || msg.senderId;
                  const isSender = senderId?.toString() === userId;
                  return (
                    <div
                      key={msg._id}
                      className={`chat-message ${isSender ? "sender" : "receiver"}`}
                    >
                      {msg.text && <div>{msg.text}</div>}
                      {msg.attachments?.map((imgUrl, idx) => (
                        <div key={idx} className="chat-image-wrapper">
                          <img
                            src={`http://localhost:2005${imgUrl}`}
                            alt="attachment"
                            className="chat-image"
                          />
                        </div>
                      ))}
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div className="chat-input-container">
              {images.length > 0 && (
                <div className="selected-image-preview">
                  {images.map((img, idx) => (
                    <div key={idx} className="thumbnail-container">
                      <img
                        src={URL.createObjectURL(img)}
                        alt={`preview-${idx}`}
                        className="chat-preview-thumbnail"
                      />
                      <button
                        className="remove-thumbnail"
                        onClick={() =>
                          setImages((prev) => prev.filter((_, i) => i !== idx))
                        }
                        disabled={loading}
                      >
                        ❌
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="chat-input">
                <button
                  type="button"
                  className="upload-icon"
                  onClick={() => document.getElementById("image-upload").click()}
                  disabled={loading}
                  style={{
                    opacity: loading ? 0.6 : 1,
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                >
                  📷
                </button>
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) =>
                    setImages((prev) => [...prev, ...Array.from(e.target.files)])
                  }
                  style={{ display: "none" }}
                  disabled={loading}
                />

                <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Type a message..."
                  disabled={loading}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !loading) {
                      handleSend();
                    }
                  }}
                />
                <button
                  onClick={handleSend}
                  disabled={loading || (!text.trim() && images.length === 0)}
                  style={{
                    opacity: loading || (!text.trim() && images.length === 0) ? 0.6 : 1,
                    cursor: loading || (!text.trim() && images.length === 0) ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loading ? '⏳' : '➤'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}