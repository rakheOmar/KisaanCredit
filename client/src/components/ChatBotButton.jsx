import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { MessageCircle, Send, Mic, MicOff, Copy, Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const ChatBotButton = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [audio, setAudio] = useState(null);
  const [currentlyPlayingText, setCurrentlyPlayingText] = useState(null);
  const [audioCache, setAudioCache] = useState({});
  const [copiedCode, setCopiedCode] = useState("");
  const messagesEndRef = useRef(null);

  // Your FastAPI backend URL - adjust this to match your setup
  const API_BASE_URL = "http://localhost:5000";

  const suggestedPrompts = [
    "What are Carbon credits?",
    "What does this website help me with?",
    "Explain the blockchain feature",
    "What is nabard?",
  ];

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      ("webkitSpeechRecognition" in window || "SpeechRecognition" in window)
    ) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();

      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = "en-US";

      recognitionInstance.onstart = () => setIsRecording(true);
      recognitionInstance.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsRecording(false);
      };
      recognitionInstance.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsRecording(false);
      };
      recognitionInstance.onend = () => setIsRecording(false);

      setRecognition(recognitionInstance);
    }
  }, []);

  const toggleRecording = () => {
    if (!recognition) {
      alert("Speech recognition not supported in your browser");
      return;
    }
    if (isRecording) {
      recognition.stop();
    } else {
      recognition.start();
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(text);
      setTimeout(() => setCopiedCode(""), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  // Simple markdown renderer using React components
  const MarkdownRenderer = ({ content }) => {
    const renderContent = () => {
      // Split content into parts for processing
      const parts = [];
      let currentIndex = 0;

      // Process the content line by line
      const lines = content.split("\n");
      const processedLines = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Headers
        if (line.startsWith("### ")) {
          processedLines.push(
            <h3 key={i} className="text-base font-medium mb-1 mt-2">
              {line.slice(4)}
            </h3>
          );
        } else if (line.startsWith("## ")) {
          processedLines.push(
            <h2 key={i} className="text-lg font-semibold mb-2 mt-3">
              {line.slice(3)}
            </h2>
          );
        } else if (line.startsWith("# ")) {
          processedLines.push(
            <h1 key={i} className="text-xl font-bold mb-2 mt-4">
              {line.slice(2)}
            </h1>
          );
        }
        // Code blocks
        else if (line.startsWith("```")) {
          const language = line.slice(3) || "text";
          const codeLines = [];
          let j = i + 1;

          while (j < lines.length && !lines[j].startsWith("```")) {
            codeLines.push(lines[j]);
            j++;
          }

          const codeContent = codeLines.join("\n");
          processedLines.push(
            <div key={i} className="relative group my-3">
              <div className="flex items-center justify-between bg-gray-800 text-gray-200 px-4 py-2 text-sm rounded-t-md">
                <span className="text-gray-300">{language}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                  onClick={() => copyToClipboard(codeContent)}
                >
                  {copiedCode === codeContent ? "✓" : "📋"}
                </Button>
              </div>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-b-md overflow-x-auto text-sm">
                <code>{codeContent}</code>
              </pre>
            </div>
          );
          i = j; // Skip to end of code block
        }
        // Lists
        else if (line.match(/^\s*[-*+]\s+/)) {
          const listContent = line.replace(/^\s*[-*+]\s+/, "");
          processedLines.push(
            <div key={i} className="text-sm ml-4 mb-1">
              • {processInlineMarkdown(listContent)}
            </div>
          );
        } else if (line.match(/^\s*\d+\.\s+/)) {
          const listContent = line.replace(/^\s*\d+\.\s+/, "");
          processedLines.push(
            <div key={i} className="text-sm ml-4 mb-1">
              {processInlineMarkdown(listContent)}
            </div>
          );
        }
        // Blockquotes
        else if (line.startsWith("> ")) {
          processedLines.push(
            <blockquote
              key={i}
              className="border-l-4 border-muted-foreground/25 pl-4 italic text-muted-foreground my-2"
            >
              {processInlineMarkdown(line.slice(2))}
            </blockquote>
          );
        }
        // Regular paragraphs
        else if (line.trim()) {
          processedLines.push(
            <p key={i} className="mb-2">
              {processInlineMarkdown(line)}
            </p>
          );
        }
        // Empty lines
        else {
          processedLines.push(<br key={i} />);
        }
      }

      return processedLines;
    };

    // Process inline markdown (bold, italic, code, links)
    const processInlineMarkdown = (text) => {
      const parts = [];
      let currentPos = 0;

      // Simple regex-based processing for inline elements
      const patterns = [
        {
          regex: /\*\*(.*?)\*\*/g,
          component: (match, content) => (
            <strong key={currentPos++} className="font-bold">
              {content}
            </strong>
          ),
        },
        {
          regex: /\*(.*?)\*/g,
          component: (match, content) => (
            <em key={currentPos++} className="italic">
              {content}
            </em>
          ),
        },
        {
          regex: /`([^`]+)`/g,
          component: (match, content) => (
            <code key={currentPos++} className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">
              {content}
            </code>
          ),
        },
        {
          regex: /\[([^\]]+)\]\(([^)]+)\)/g,
          component: (match, text, url) => (
            <a
              key={currentPos++}
              href={url}
              className="text-blue-500 hover:text-blue-700 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {text}
            </a>
          ),
        },
      ];

      let processedText = text;
      const elements = [];

      // For now, let's keep it simple and just handle basic formatting
      processedText = processedText
        .split(/(\*\*.*?\*\*|\*.*?\*|`[^`]+`|\[.*?\]\(.*?\))/)
        .map((part, index) => {
          if (part.match(/^\*\*(.*)\*\*$/)) {
            return (
              <strong key={index} className="font-bold">
                {part.slice(2, -2)}
              </strong>
            );
          } else if (part.match(/^\*(.*)\*$/)) {
            return (
              <em key={index} className="italic">
                {part.slice(1, -1)}
              </em>
            );
          } else if (part.match(/^`([^`]+)`$/)) {
            return (
              <code key={index} className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">
                {part.slice(1, -1)}
              </code>
            );
          } else if (part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)) {
            const match = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
            return (
              <a
                key={index}
                href={match[2]}
                className="text-blue-500 hover:text-blue-700 underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {match[1]}
              </a>
            );
          }
          return part;
        });

      return processedText;
    };

    return (
      <div className="prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
        {renderContent()}
      </div>
    );
  };

  // TTS playback with caching - Fixed implementation with stop functionality
  const playTTS = async (text) => {
    try {
      // If this text is currently playing, stop it
      if (currentlyPlayingText === text && audio) {
        audio.pause();
        audio.currentTime = 0;
        setAudio(null);
        setCurrentlyPlayingText(null);
        console.log("Audio stopped");
        return;
      }

      // Stop any currently playing audio
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }

      // If cached, reuse audio
      if (audioCache[text]) {
        const newAudio = new Audio(audioCache[text]);
        setAudio(newAudio);
        setCurrentlyPlayingText(text);

        newAudio.onerror = (e) => {
          console.error("Audio playback error:", e);
          alert("Failed to play audio. The audio file might be corrupted.");
          setCurrentlyPlayingText(null);
        };

        newAudio.onended = () => {
          console.log("Audio playback finished");
          setCurrentlyPlayingText(null);
        };

        await newAudio.play();
        return;
      }

      console.log("Fetching TTS audio for:", text);

      // Fetch audio as blob from backend
      const response = await fetch(`${API_BASE_URL}/speak`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: text }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const audioBlob = await response.blob();
      console.log("Audio blob size:", audioBlob.size, "bytes");

      if (audioBlob.size === 0) {
        throw new Error("Received empty audio file");
      }

      const blobUrl = URL.createObjectURL(audioBlob);
      setAudioCache((prev) => ({ ...prev, [text]: blobUrl }));

      const newAudio = new Audio(blobUrl);
      setAudio(newAudio);
      setCurrentlyPlayingText(text);

      newAudio.onerror = (e) => {
        console.error("Audio playback error:", e);
        alert("Failed to play audio. Please try again.");
        setCurrentlyPlayingText(null);
      };

      newAudio.onended = () => {
        console.log("Audio playback finished");
        setCurrentlyPlayingText(null);
      };

      await newAudio.play();
      console.log("Audio playback started successfully");
    } catch (err) {
      console.error("TTS error:", err);
      setCurrentlyPlayingText(null);

      if (err.name === "NotAllowedError") {
        alert(
          "Audio playback was blocked. Please click somewhere on the page first and try again."
        );
      } else if (err.message.includes("HTTP error")) {
        alert("Failed to generate speech. Please check your internet connection.");
      } else {
        alert("Text-to-speech is not working right now. Please try again later.");
      }
    }
  };

  const handleSend = async (prompt) => {
    const currentInput = (typeof prompt === "string" ? prompt : input).trim();
    if (!currentInput) return;

    const userMsg = { from: "user", text: currentInput };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const history = messages.map((msg) => ({
        role: msg.from === "bot" ? "model" : "user",
        parts: [{ text: msg.text }],
      }));

      console.log("Sending chat request:", { message: currentInput, history });

      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: currentInput,
          history,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Chat response:", data);

      let botReply = data?.data?.reply || "Sorry, I couldn't get a response.";

      // Check for navigation commands
      const navRegex = /NAVIGATE_TO::(\/\S*)/;
      const navMatch = botReply.match(navRegex);

      if (navMatch) {
        const path = navMatch[1];
        const cleanReply = botReply.replace(navRegex, "").trim();
        if (cleanReply) {
          setMessages((prev) => [...prev, { from: "bot", text: cleanReply }]);
        }
        setTimeout(() => {
          console.log(`Navigating to: ${path}`);
          // navigate(path); // Uncomment if using router
        }, 500);
      } else {
        setMessages((prev) => [...prev, { from: "bot", text: botReply }]);
      }
    } catch (error) {
      console.error("Chat error:", error);
      let errorMessage = "Sorry, something went wrong. Please try again.";

      if (error.message.includes("Failed to fetch")) {
        errorMessage = "Cannot connect to the server. Please check if the backend is running.";
      } else if (error.message.includes("HTTP error")) {
        errorMessage = `Server error: ${error.message}. Please try again.`;
      }

      setMessages((prev) => [
        ...prev,
        {
          from: "bot",
          text: errorMessage,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{ from: "bot", text: "Hi! I'm **Carbon bot**. How can I help you today?" }]);
    }
  }, [isOpen]);

  // Cleanup audio URLs when component unmounts
  useEffect(() => {
    return () => {
      Object.values(audioCache).forEach((url) => {
        URL.revokeObjectURL(url);
      });
    };
  }, [audioCache]);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button className="rounded-full h-14 w-14 p-0 shadow-lg">
            <MessageCircle className="w-6 h-6" />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          side="top"
          align="end"
          sideOffset={12}
          className="w-[90vw] max-w-[400px] h-[70vh] sm:h-[600px] flex flex-col p-0"
        >
          {/* Header */}
          <div className="border-b px-4 py-3 text-sm font-semibold flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              KisaanCredit Chat Assistant
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setIsOpen(false)}
            >
              &times;
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 text-sm">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`px-3 py-2 rounded-lg max-w-[85%] relative group ${
                  msg.from === "user"
                    ? "ml-auto bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                {msg.from === "bot" ? (
                  <MarkdownRenderer content={msg.text} />
                ) : (
                  <div className="whitespace-pre-wrap">{msg.text}</div>
                )}

                {msg.from === "bot" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`absolute -right-8 top-1/2 -translate-y-1/2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted ${
                      currentlyPlayingText === msg.text ? "opacity-100 bg-blue-100" : ""
                    }`}
                    onClick={() => playTTS(msg.text)}
                    title={currentlyPlayingText === msg.text ? "Stop audio" : "Play audio"}
                  >
                    {currentlyPlayingText === msg.text ? "⏹️" : "🔊"}
                  </Button>
                )}
              </div>
            ))}

            {/* Recording indicator */}
            {isRecording && (
              <div className="flex justify-start">
                <div className="bg-muted text-foreground px-3 py-2 rounded-lg max-w-[85%] border-2 border-red-300">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-red-600">Listening...</span>
                  </div>
                </div>
              </div>
            )}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted text-foreground px-3 py-2 rounded-lg max-w-[85%]">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Prompts */}
          {messages.length <= 1 && !isLoading && (
            <div className="p-4 border-t">
              <p className="text-xs text-muted-foreground mb-3 font-medium">Try one of these:</p>
              <div className="flex flex-wrap gap-2">
                {suggestedPrompts.map((prompt, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    className="text-xs h-auto py-2 px-3 text-wrap text-left"
                    onClick={() => handleSend(prompt)}
                  >
                    {prompt}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="border-t p-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder={isRecording ? "Listening..." : "Ask Carbon bot anything..."}
                className="flex-1 px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <Button
                type="button"
                size="sm"
                variant={isRecording ? "destructive" : "outline"}
                onClick={toggleRecording}
                disabled={isLoading}
                title={isRecording ? "Stop recording" : "Start voice input"}
              >
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </Button>
              <Button onClick={() => handleSend()} size="sm" disabled={isLoading || !input.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default ChatBotButton;
