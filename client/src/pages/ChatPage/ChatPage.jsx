import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import * as conversationService from "../../services/conversationService";
import styles from "./ChatPage.module.css";

export default function ChatPage() {
  const { user, logout, isLoading, isAuthenticated } = useAuth();

  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [chatFeed, setChatFeed] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  // Only fetch conversations when user is authenticated and not loading
  useEffect(() => {
    if (!isAuthenticated || isLoading) return;

    const fetchConversations = async () => {
      try {
        const data = await conversationService.getConversations();
        setConversations(data);
        if (data.length > 0) {
          setActiveConversationId(data[0].id);
        }
        // Note: If no conversations exist, activeConversationId stays null
        // and we'll create one when the user sends their first message
      } catch (error) {
        console.error("Failed to fetch conversations:", error);
      }
    };
    fetchConversations();
  }, [isAuthenticated, isLoading]);

  useEffect(() => {
    if (!activeConversationId || !isAuthenticated || isLoading) return;

    const fetchMessages = async () => {
      setIsLoadingMessages(true);
      try {
        const data = await conversationService.getMessagesForConversation(
          activeConversationId
        );
        setChatFeed(data);
      } catch (error) {
        console.error("Failed to fetch messages:", error);
      } finally {
        setIsLoadingMessages(false);
      }
    };
    fetchMessages();
  }, [activeConversationId, isAuthenticated, isLoading]);

  const handleSendMessage = async () => {
    // Only check if input is empty - allow sending even without active conversation
    if (!inputValue.trim()) {
      return;
    }

    let conversationId = activeConversationId;

    // If no active conversation exists, create one
    if (!conversationId) {
      try {
        console.log("Creating new conversation for first message...");
        const newConvo = await conversationService.createConversation(
          "New Chat"
        );
        setConversations((prev) => [newConvo, ...prev]);
        setActiveConversationId(newConvo.id);
        conversationId = newConvo.id;
        console.log("New conversation created:", newConvo.id);
      } catch (error) {
        console.error("Failed to create conversation:", error);
        return;
      }
    }

    const userMessage = {
      role_id: user.roleId,
      content: inputValue,
    };

    // Add user message to chat feed immediately
    setChatFeed((prevFeed) => [...prevFeed, userMessage]);
    const currentInput = inputValue;
    setInputValue("");
    setIsLoadingMessages(true);

    try {
      console.log("Sending message to conversation:", conversationId);
      const aiResponse = await conversationService.postMessage(
        conversationId,
        currentInput
      );
      console.log("Received AI response:", aiResponse);
      setChatFeed((prevFeed) => [...prevFeed, aiResponse]);
    } catch (error) {
      console.error("Failed to send message:", error);
      // Remove the user message from feed if sending failed
      setChatFeed((prevFeed) => prevFeed.slice(0, -1));
      // Restore the input value
      setInputValue(currentInput);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Show loading state while auth is being verified
  if (isLoading) {
    return <div>Loading...</div>;
  }

  // Show nothing if not authenticated (App.jsx will handle redirect)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className={styles.app}>
      <div className={styles.sidebar}>
        <ul>
          {conversations.length > 0 ? (
            conversations.map((convo) => (
              <li
                key={convo.id}
                className={
                  convo.id === activeConversationId ? styles.active : ""
                }
                onClick={() => setActiveConversationId(convo.id)}
              >
                {convo.title}
              </li>
            ))
          ) : (
            <li style={{ color: "#888", fontStyle: "italic" }}>
              No conversations yet. Start chatting!
            </li>
          )}
        </ul>
        <button onClick={logout} className={styles.logoutButton}>
          Logout
        </button>
      </div>

      <div className={styles.main}>
        <h1>LandAI Assistant</h1>
        <ul className={styles.feed}>
          {chatFeed.length > 0 ? (
            chatFeed.map((message, index) => (
              <li
                key={index}
                className={`${styles.chatMessage} ${
                  message.role_id === user.roleId
                    ? styles.user
                    : styles.assistant
                }`}
              >
                <p>{message.content}</p>
              </li>
            ))
          ) : (
            <li
              style={{
                color: "#888",
                fontStyle: "italic",
                textAlign: "center",
                listStyle: "none",
                padding: "20px",
              }}
            >
              Welcome! Send a message to start your first conversation.
            </li>
          )}
          {isLoadingMessages && (
            <li className={styles.loadingMessage}>Thinking...</li>
          )}
        </ul>
        <div className={styles.bottomSection}>
          <div className={styles.inputContainer}>
            <input
              type="text"
              placeholder={
                conversations.length === 0
                  ? "Type your first message to start a conversation..."
                  : "Type your message..."
              }
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            />
            <div id={styles.submit} onClick={handleSendMessage}>
              ➢
            </div>
          </div>
          <p className={styles.info}>
            LandAI Assistant - Your Partner in Land Acquisition
          </p>
        </div>
      </div>
    </div>
  );
}
