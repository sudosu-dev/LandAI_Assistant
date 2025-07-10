import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import * as conversationService from "../../services/conversationService";
import FileUploadModal from "../../components/FileUploadModal/FileUploadModal";
import AnalysisModal from "../../components/AnalysisModal/AnalysisModal";
import Tooltip from "../../components/Tooltip/Tooltip";
import styles from "./ChatPage.module.css";

// SVG Icon Components
const SendIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M7 11L12 6L17 11M12 18V7"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
  </svg>
);
const MenuIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M4 6H20M4 12H20M4 18H20"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
const FileIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M14 2V8H20"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ReanalyzeIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M17.65 6.35C16.2 4.9 14.21 4 12 4C7.58 4 4.01 7.58 4.01 12C4.01 16.42 7.58 20 12 20C15.73 20 18.84 17.45 19.73 14H17.65C16.83 16.33 14.61 18 12 18C8.69 18 6 15.31 6 12C6 8.69 8.69 6 12 6C13.66 6 15.14 6.69 16.22 7.78L13 11H20V4L17.65 6.35Z"
      fill="currentColor"
    />
  </svg>
);

const Button = ({ onClick, children, disabled, className, ...props }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={className}
    {...props}
  >
    {children}
  </button>
);

export default function ChatPage() {
  const { user, logout } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [chatFeed, setChatFeed] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [analysisTarget, setAnalysisTarget] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const chatContainerRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [inputValue]);

  useEffect(() => {
    chatContainerRef.current?.scrollTo(
      0,
      chatContainerRef.current.scrollHeight
    );
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
    if (!inputValue.trim() || isProcessing) return;
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
    setChatFeed((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsProcessing(true);
    try {
      const response = await conversationService.postMessage(
        conversationId,
        currentInput
      );
      setChatFeed((prev) => [
        ...prev.slice(0, -1),
        response.userMessage,
        response.aiMessage,
      ]);
    } catch (error) {
      console.error("Failed to send message:", error);
      setChatFeed((prev) => prev.slice(0, -1));
      setInputValue(currentInput);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateNewChat = () => setActiveConversationId(null);
  const onUploadSuccess = (messagesFromServer) =>
    setChatFeed((prev) => [...prev, ...messagesFromServer]);
  const handleReanalyzeClick = (message) =>
    setAnalysisTarget({
      documentId: message.documentId,
      initialContext: message.contextData,
    });

  const handleAnalysisSubmit = async (newContext) => {
    if (!analysisTarget?.documentId) return;
    setIsProcessing(true);
    setAnalysisTarget(null);
    try {
      const newAnalysisMessage = await conversationService.reanalyzeDocument(
        analysisTarget.documentId,
        newContext
      );
      setChatFeed((prev) => [...prev, newAnalysisMessage]);
    } catch (error) {
      console.error("Failed to re-analyze document:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenUploadModal = async () => {
    if (isProcessing) return;
    if (!activeConversationId) {
      try {
        const newConvo = await conversationService.createConversation(
          "New Document Analysis"
        );
        setConversations((prev) => [newConvo, ...prev]);
        setActiveConversationId(newConvo.id);
        setChatFeed([]);
      } catch (error) {
        console.error("Failed to create conversation for upload:", error);
        return;
      }
    }
    setIsModalOpen(true);
  };

  return (
    <div className={styles.chatPage}>
      <div className={`${styles.sidebar} ${isSidebarOpen ? styles.open : ""}`}>
        <div className={styles.sidebarContent}>
          <Button
            onClick={() => {
              handleCreateNewChat();
              setIsSidebarOpen(false);
            }}
            className={styles.newChatButton}
          >
            + New Chat
          </Button>
          <ul className={styles.conversationList}>
            {conversations.map((convo) => (
              <li
                key={convo.id}
                className={`${styles.conversationItem} ${
                  convo.id === activeConversationId ? styles.active : ""
                }`}
                onClick={() => {
                  setActiveConversationId(convo.id);
                  setIsSidebarOpen(false);
                }}
              >
                {convo.title}
              </li>
            ))}
          </ul>
        </div>
        <Button onClick={logout} className={styles.logoutButton}>
          Logout
        </Button>
      </div>
      <div
        className={`${styles.sidebarOverlay} ${
          isSidebarOpen ? styles.open : ""
        }`}
        onClick={() => setIsSidebarOpen(false)}
      ></div>
      <div className={styles.mainContent}>
        <div className={styles.chatHeader}>
          <button
            className={styles.menuButton}
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            <MenuIcon />
          </button>
          <h2 className={styles.headerTitle}>
            {conversations.find((c) => c.id === activeConversationId)?.title ||
              "New Chat"}
          </h2>
        </div>
        <div className={styles.chatContainer} ref={chatContainerRef}>
          {chatFeed.length > 0 ? (
            <ul className={styles.feed}>
              {chatFeed.map((message, index) => {
                const isAnalysis = message.agentType === "land_analyzer_pro";
                const hasMarketData =
                  isAnalysis && message.contextData?.recentSales?.length > 0;
                const tooltipText = hasMarketData
                  ? `Based on ${message.contextData.recentSales.length} recent sales.`
                  : "";

                return (
                  <li key={index} className={styles.chatMessage}>
                    <pre className={styles.messageContent}>
                      {message.content}
                    </pre>
                    {isAnalysis && (
                      <div className={styles.analysisActions}>
                        {hasMarketData && (
                          <Tooltip text={tooltipText}>
                            <div className={styles.marketDataBadge}>
                              ✅ Live Market Data
                            </div>
                          </Tooltip>
                        )}
                        {/* This is the corrected line */}
                        <Button
                          onClick={() => handleReanalyzeClick(message)}
                          className={styles.reanalyzeButton}
                          title="Re-analyze"
                        >
                          <ReanalyzeIcon />
                        </Button>
                      </div>
                    )}
                  </li>
                );
              })}
              {isProcessing && (
                <li
                  className={styles.chatMessage}
                  style={{ textAlign: "center" }}
                >
                  Thinking...
                </li>
              )}
            </ul>
          ) : (
            <div style={{ textAlign: "center", paddingTop: "20vh" }}>
              <h1>LandAI Assistant</h1>
            </div>
          )}
        </div>
        <div className={styles.bottomSection}>
          <div className={styles.inputContainer}>
            <textarea
              ref={textareaRef}
              className={styles.chatTextarea}
              placeholder="Type a message..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" &&
                !e.shiftKey &&
                (e.preventDefault(), handleSendMessage())
              }
              disabled={isProcessing}
              rows="1"
            />
            <button
              className={styles.chatButton}
              onClick={handleOpenUploadModal}
              disabled={isProcessing}
              title="Upload Document"
            >
              <FileIcon />
            </button>
            <button
              className={styles.chatButton}
              onClick={handleSendMessage}
              disabled={isProcessing || !inputValue}
              title="Send Message"
            >
              <SendIcon />
            </button>
          </div>
          <p className={styles.infoText}>
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
