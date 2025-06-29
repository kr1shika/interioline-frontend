import axios from "axios";
import { useEffect, useRef, useState } from "react";
import "../style/ChatWidget.css";

export default function ChatWidget() {
  const [chatRooms, setChatRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [images, setImages] = useState([]);
  const userId = localStorage.getItem("userId");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const fetchChatRooms = async () => {
      try {
        const res = await axios.get(`http://localhost:2005/api/project/user/${userId}`);
        setChatRooms(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Error fetching chat rooms:", err);
        setChatRooms([]);
      }
    };

    if (userId) fetchChatRooms();
  }, [userId]);

  const openChatRoom = async (roomId) => {
    try {
      setSelectedRoomId(roomId);
      const res = await axios.get(`http://localhost:2005/api/chat/${roomId}`);
      setMessages(Array.isArray(res.data) ? res.data : []);
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: "auto" });
        }
      }, 100);
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  };

  const handleSend = async () => {
    if (!text.trim() && images.length === 0) return;

    const firstMsg = messages.find((m) => m.senderId?._id || m.receiverId?._id);
    const receiverId =
      firstMsg?.senderId?._id?.toString() === userId
        ? firstMsg?.receiverId?._id
        : firstMsg?.senderId?._id;

    const formData = new FormData();
    formData.append("senderId", userId);
    formData.append("receiverId", receiverId);
    formData.append("text", text);
    images.forEach((img) => formData.append("attachments", img));

    try {
      const res = await axios.post(
        `http://localhost:2005/api/chat/${selectedRoomId}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setMessages((prev) => [...prev, res.data]);
      setText("");
      setImages([]);
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const currentRoom = chatRooms.find(r => r._id === selectedRoomId);

  return (
    <div className="chat-widget">
      {/* Header */}
      <div className="chat-header">
        {selectedRoomId ? (currentRoom?.title || "Project") : "Messages"}
      </div>

      {!selectedRoomId ? (
        <div className="chat-room-list">
          {chatRooms.length === 0 ? (
            <p className="text-sm text-gray-500">No chat rooms found.</p>
          ) : (
            chatRooms.map((room) => (
              <div
                key={room._id}
                onClick={() => openChatRoom(room._id)}
                className="chat-room-card"
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
          >
            ← Back to Rooms
          </button>

          {/* Content container: messages + input */}
          <div className="chat-content-container" style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
            <div className="chat-messages" style={{ flex: 1, overflowY: "auto" }}>
              {messages.map((msg) => {
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
              })}
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
                />

                <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Type a message..."
                />
                <button onClick={handleSend}>➤</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
