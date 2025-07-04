import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import * as conversationService from "../../services/conversationService";
import FileUploadModal from "../../components/FileUploadModal/FileUploadModal";
import AnalysisModal from "../../components/AnalysisModal/AnalysisModal";
import Button from "../../components/Button/Button";
import styles from "./ChatPage.module.css";
console.log("***** Imported Conversation Service: *****", conversationService);

export default function ChatPage() {
  const { user, logout, isLoading, isAuthenticated } = useAuth();

  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [chatFeed, setChatFeed] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [analysisTarget, setAnalysisTarget] = useState(null);

  useEffect(() => {
    if (!isAuthenticated || isLoading) return;
    const fetchConversations = async () => {
      try {
        const data = await conversationService.getConversations();
        setConversations(data);
        if (data.length > 0 && !activeConversationId) {
          setActiveConversationId(data[0].id);
        }
      } catch (error) {
        console.error("Failed to fetch conversations:", error);
      }
    };
    fetchConversations();
  }, [isAuthenticated, isLoading, activeConversationId]);

  useEffect(() => {
    if (!activeConversationId || !isAuthenticated || isLoading) return;
    const fetchMessages = async () => {
      setIsUploading(true);
      try {
        const data = await conversationService.getMessagesForConversation(
          activeConversationId
        );
        setChatFeed(data);
      } catch (error) {
        console.error("Failed to fetch messages:", error);
      } finally {
        setIsUploading(false);
      }
    };
    fetchMessages();
  }, [activeConversationId, isAuthenticated, isLoading]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

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
      roleId: user.roleId,
      content: inputValue,
    };
    setChatFeed((prevFeed) => [...prevFeed, userMessage]);
    const currentInput = inputValue;
    setInputValue("");
    setIsUploading(true);

    try {
      const response = await conversationService.postMessage(
        conversationId,
        currentInput
      );
      setChatFeed((prevFeed) => [...prevFeed, response.newMessage]);
    } catch (error) {
      console.error("Failed to send message:", error);
      setChatFeed((prevFeed) => prevFeed.slice(0, -1));
      setInputValue(currentInput);
    } finally {
      setIsUploading(false);
    }
  };

  const onUploadSuccess = (messagesFromServer) => {
    setChatFeed((prevFeed) => [...prevFeed, ...messagesFromServer]);
  };

  const handleReanalyzeClick = (message) => {
    setAnalysisTarget({
      documentId: message.documentId,
      initialContext: message.contextData,
    });
  };

  const handleAnalysisSubmit = async (newContext) => {
    if (!analysisTarget?.documentId) return;

    setIsUploading(true); // Show the "Thinking..." indicator
    setAnalysisTarget(null); // Close the modal immediately

    try {
      // This is the crucial part that calls the API
      const newAnalysisMessage = await conversationService.reanalyzeDocument(
        analysisTarget.documentId,
        newContext
      );
      // Add the new report to the chat feed
      setChatFeed((prevFeed) => [...prevFeed, newAnalysisMessage]);
    } catch (error) {
      console.error("Failed to re-analyze document:", error);
    } finally {
      setIsUploading(false); // Hide the "Thinking..." indicator
    }
  };

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
            <li>No conversations yet.</li>
          )}
        </ul>
        <Button onClick={logout}>Logout</Button>
      </div>

      <div className={styles.main}>
        <div className={styles.chatContainer}>
          <ul className={styles.feed}>
            {chatFeed.map((message, index) => {
              // Add this log to inspect the message object in the browser
              console.log("Rendering message object:", message);

              return (
                <li
                  key={index}
                  className={`${styles.chatMessage} ${
                    message.roleId === user?.roleId
                      ? styles.user
                      : styles.assistant
                  }`}
                >
                  <p>{message.content}</p>
                  {message.agentType === "land_analyzer_pro" && (
                    <div className={styles.analysisActions}>
                      <Button onClick={() => handleReanalyzeClick(message)}>
                        Re-analyze
                      </Button>
                    </div>
                  )}
                </li>
              );
            })}
            {isUploading && (
              <li className={styles.loadingMessage}>Thinking...</li>
            )}
          </ul>
        </div>
        <div className={styles.bottomSection}>
          <div className={styles.inputContainer}>
            <input
              type="text"
              placeholder="Type your message..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            />
            <Button onClick={() => setIsModalOpen(true)}>Upload File</Button>
            <div id={styles.submit} onClick={handleSendMessage}>
              ➢
            </div>
          </div>
          <p className={styles.info}>LandAI Assistant</p>
        </div>
      </div>

      <FileUploadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUploadSuccess={onUploadSuccess}
        conversationId={activeConversationId}
      />
      <AnalysisModal
        isOpen={!!analysisTarget}
        onClose={() => setAnalysisTarget(null)}
        onSubmit={handleAnalysisSubmit}
        initialContext={analysisTarget?.initialContext}
      />
    </div>
  );
}
