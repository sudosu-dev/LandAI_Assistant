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
      } catch (error) {
        console.error("Failed to fetch conversations:", error);
      }
    };
    fetchConversations();
  }, [isAuthenticated, isLoading]); // Added dependencies

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
  }, [activeConversationId, isAuthenticated, isLoading]); // Added dependencies

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !activeConversationId) {
      return;
    }

    // if no active conversations, create one with the first message
    let conversationId = activeConversationId;
    if (!conversationId) {
      try {
        const newConvo = await conversationService.createConversation(
          "New Chat"
        );
        setConversations((prev) => [newConvo, ...prev]);
        setActiveConversationId(newConvo.id);
        conversationId = newConvo.id;
      } catch (error) {
        console.error("Failed to create conversation:", error);
        return;
      }
    }

    const userMessage = {
      role_id: user.roleId,
      content: inputValue,
    };

    setChatFeed((prevFeed) => [...prevFeed, userMessage]);
    const currentInput = inputValue;
    setInputValue("");
    setIsLoadingMessages(true);

    try {
      const aiResponse = await conversationService.postMessage(
        activeConversationId,
        currentInput
      );
      setChatFeed((prevFeed) => [...prevFeed, aiResponse]);
    } catch (error) {
      console.error("Failed to send message:", error);
      setChatFeed((prevFeed) => prevFeed.slice(0, -1));
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
          {conversations.map((convo) => (
            <li
              key={convo.id}
              className={convo.id === activeConversationId ? styles.active : ""}
              onClick={() => setActiveConversationId(convo.id)}
            >
              {convo.title}
            </li>
          ))}
        </ul>
        <button onClick={logout} className={styles.logoutButton}>
          Logout
        </button>
      </div>

      <div className={styles.main}>
        <h1>LandAI Assistant</h1>
        <ul className={styles.feed}>
          {chatFeed.map((message, index) => (
            <li
              key={index}
              className={`${styles.chatMessage} ${
                message.role_id === user.roleId ? styles.user : styles.assistant
              }`}
            >
              <p>{message.content}</p>
            </li>
          ))}
          {isLoadingMessages && (
            <li className={styles.loadingMessage}>Thinking...</li>
          )}
        </ul>
        <div className={styles.bottomSection}>
          <div className={styles.inputContainer}>
            <input
              type="text"
              placeholder="Type your message..."
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
