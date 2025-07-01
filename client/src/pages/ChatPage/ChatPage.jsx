import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import * as conversationService from "../../services/conversationService";
import styles from "./ChatPage.module.css";

export default function ChatPage() {
  const { user, logout } = useAuth();

  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [chatFeed, setChatFeed] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    if (!activeConversationId) return;

    const fetchMessages = async () => {
      setIsLoading(true);
      try {
        const data = await conversationService.getMessagesForConversation(
          activeConversationId
        );
        setChatFeed(data);
      } catch (error) {
        console.error("Failed to fetch messages:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMessages();
  }, [activeConversationId]);

  const handleSendMessage = async () => {
    console.log("Button clicked!");
    console.log("inputValue:", inputValue);
    console.log("activeConversationId:", activeConversationId);

    if (!inputValue.trim() || !activeConversationId) {
      console.log("Early return - missing input or conversation");

      return;
    }
    console.log("Past the early return - about to send message");

    const userMessage = {
      role_id: user.roleId,
      content: inputValue,
    };

    setChatFeed((prevFeed) => [...prevFeed, userMessage]);
    const currentInput = inputValue;
    setInputValue("");
    setIsLoading(true);

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
      setIsLoading(false);
    }
  };

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
          {isLoading && <li className={styles.loadingMessage}>Thinking...</li>}
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
