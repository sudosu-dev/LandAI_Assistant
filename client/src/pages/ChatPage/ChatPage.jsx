import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import * as conversationService from "../../services/conversationService";
import FileUploadModal from "../../components/FileUploadModal/FileUploadModal";
import AnalysisModal from "../../components/AnalysisModal/AnalysisModal";
import Button from "../../components/Button/Button";
import styles from "./ChatPage.module.css";

export default function ChatPage() {
  const { user, logout } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [chatFeed, setChatFeed] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [analysisTarget, setAnalysisTarget] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [chatFeed]);

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    if (!activeConversationId) {
      setChatFeed([]);
      return;
    }
    const fetchMessages = async () => {
      setIsProcessing(true);
      try {
        const data = await conversationService.getMessagesForConversation(
          activeConversationId
        );
        setChatFeed(data);
      } catch (error) {
        console.error("Failed to fetch messages:", error);
      } finally {
        setIsProcessing(false);
      }
    };
    fetchMessages();
  }, [activeConversationId]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    const currentInput = inputValue.trim();
    let conversationId = activeConversationId;

    if (!conversationId) {
      try {
        const newConvo = await conversationService.createConversation(
          currentInput
        );
        setConversations((prev) => [newConvo, ...prev]);
        setActiveConversationId(newConvo.id);
        conversationId = newConvo.id;
        setChatFeed([]);
      } catch (error) {
        console.error("Failed to create conversation:", error);
        return;
      }
    }

    const userMessage = { roleId: user.roleId, content: currentInput };
    setChatFeed((prevFeed) => [...prevFeed, userMessage]);
    setInputValue("");
    setIsProcessing(true);

    try {
      const response = await conversationService.postMessage(
        conversationId,
        currentInput
      );
      setChatFeed((prevFeed) => [
        ...prevFeed.slice(0, -1),
        response.userMessage,
        response.aiMessage,
      ]);
    } catch (error) {
      console.error("Failed to send message:", error);
      setChatFeed((prevFeed) => prevFeed.slice(0, -1));
      setInputValue(currentInput);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateNewChat = () => {
    setActiveConversationId(null);
    setInputValue("");
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
    setIsProcessing(true);
    setAnalysisTarget(null);
    try {
      const newAnalysisMessage = await conversationService.reanalyzeDocument(
        analysisTarget.documentId,
        newContext
      );
      setChatFeed((prevFeed) => [...prevFeed, newAnalysisMessage]);
    } catch (error) {
      console.error("Failed to re-analyze document:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={styles.app}>
      <div className={styles.sidebar}>
        <div className={styles.sidebarContent}>
          <Button onClick={handleCreateNewChat} type="button" fullWidth>
            + New Chat
          </Button>
          <ul className={styles.conversationList}>
            {conversations.map((convo) => (
              <li
                key={convo.id}
                className={
                  convo.id === activeConversationId ? styles.active : ""
                }
                onClick={() => setActiveConversationId(convo.id)}
              >
                {convo.title}
              </li>
            ))}
          </ul>
        </div>
        <Button onClick={logout}>Logout</Button>
      </div>

      <div className={styles.main}>
        <div className={styles.chatContainer} ref={chatContainerRef}>
          {chatFeed.length > 0 ? (
            <ul className={styles.feed}>
              {chatFeed.map((message, index) => {
                const isAnalysis = message.agentType === "land_analyzer_pro";
                const hasMarketData =
                  isAnalysis && message.contextData?.recentSales;

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
                    {isAnalysis && (
                      <div className={styles.analysisActions}>
                        {hasMarketData && (
                          <div className={styles.marketDataBadge}>
                            Live Market Data
                          </div>
                        )}
                        <Button onClick={() => handleReanalyzeClick(message)}>
                          Re-analyze
                        </Button>
                      </div>
                    )}
                  </li>
                );
              })}
              {isProcessing && (
                <li className={styles.loadingMessage}>Thinking...</li>
              )}
            </ul>
          ) : (
            <div className={styles.welcomeMessage}>
              <h1>LandAI Assistant</h1>
              <p>Your expert partner in land acquisition.</p>
            </div>
          )}
        </div>
        <div className={styles.bottomSection}>
          <div className={styles.inputContainer}>
            <input
              type="text"
              placeholder="Type your message or upload a file..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              disabled={isProcessing}
            />
            <Button
              onClick={() => setIsModalOpen(true)}
              disabled={isProcessing || !activeConversationId}
            >
              Upload File
            </Button>
            <div
              id={styles.submit}
              onClick={!isProcessing ? handleSendMessage : undefined}
              className={isProcessing ? styles.disabled : ""}
            >
              ➢
            </div>
          </div>
          <p className={styles.info}>
            LandAI can make mistakes. Consider checking important information.
          </p>
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
