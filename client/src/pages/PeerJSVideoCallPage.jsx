import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Peer from "peerjs";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Send,
  Paperclip,
  Copy,
  VideoIcon,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

function arrayBufferToBase64(buffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToArrayBuffer(base64) {
  const binary_string = window.atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}

const VideoPlayer = React.memo(({ stream, username, isMuted }) => {
  const videoRef = useRef(null);
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);
  return (
    <div className="relative aspect-video w-full rounded-lg bg-black overflow-hidden shadow-lg">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isMuted}
        className="h-full w-full object-cover"
      />
      <div className="absolute bottom-2 left-2 rounded-md px-2 py-1 text-xs font-medium bg-black/50 text-white backdrop-blur-sm">
        {username || "Guest"}
      </div>
    </div>
  );
});

const PeerJSVideoCallPage = () => {
  const { roomId: paramRoomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [myPeer, setMyPeer] = useState(null);
  const [myPeerId, setMyPeerId] = useState("");
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({});
  const [messages, setMessages] = useState([]);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [username, setUsername] = useState(user?.fullname || "");
  const [isLobby, setIsLobby] = useState(true);

  const connectionsRef = useRef({});

  useEffect(() => {
    const peer = new Peer(undefined, {
      host: "localhost",
      port: 8000,
      path: "/peerjs",
    });
    setMyPeer(peer);
    peer.on("open", (id) => setMyPeerId(id));
    peer.on("error", () =>
      toast.error("Connection Error", { description: "Could not connect to the peer server." })
    );
    return () => {
      peer.destroy();
    };
  }, []);

  const handleData = useCallback((data, peerId) => {
    try {
      const parsedData = JSON.parse(data);
      switch (parsedData.type) {
        case "chat":
          setMessages((prev) => [...prev, parsedData.data]);
          break;
        case "file":
          const { fileName, fileType, fileData, sender } = parsedData.data;
          const arrayBuffer = base64ToArrayBuffer(fileData);
          const blob = new Blob([arrayBuffer], { type: fileType });
          const url = URL.createObjectURL(blob);
          setMessages((prev) => [...prev, { type: "file", fileName, url, sender }]);
          break;
        case "username":
          setRemoteStreams((prev) => ({
            ...prev,
            [peerId]: { ...prev[peerId], username: parsedData.data },
          }));
          break;
        default:
          break;
      }
    } catch (e) {
      console.error("Failed to handle incoming data:", e);
    }
  }, []);

  const addRemoteStream = useCallback((peerId, stream, remoteUsername) => {
    setRemoteStreams((prev) => ({
      ...prev,
      [peerId]: { ...prev[peerId], stream, username: remoteUsername },
    }));
  }, []);

  const removeRemoteStream = useCallback((peerId) => {
    setRemoteStreams((prev) => {
      const { [peerId]: _, ...rest } = prev;
      return rest;
    });
    delete connectionsRef.current[peerId];
  }, []);

  const handleNewConnection = useCallback(
    (conn) => {
      connectionsRef.current[conn.peer] = conn;
      conn.on("data", (data) => handleData(data, conn.peer));
      conn.on("close", () => removeRemoteStream(conn.peer));

      if (conn.open) {
        conn.send(JSON.stringify({ type: "username", data: username }));
      } else {
        conn.on("open", () => {
          conn.send(JSON.stringify({ type: "username", data: username }));
        });
      }
    },
    [username, handleData, removeRemoteStream]
  );

  useEffect(() => {
    if (!myPeer || !localStream) return;

    myPeer.on("call", (call) => {
      call.answer(localStream);
      call.on("stream", (remoteStream) => {
        if (!connectionsRef.current[call.peer]) {
          const conn = myPeer.connect(call.peer);
          handleNewConnection(conn);
        }
        addRemoteStream(call.peer, remoteStream, "New User");
      });
    });

    myPeer.on("connection", handleNewConnection);

    return () => {
      myPeer.off("call");
      myPeer.off("connection");
    };
  }, [myPeer, localStream, handleNewConnection, addRemoteStream]);

  const broadcastData = (data) => {
    Object.values(connectionsRef.current).forEach((conn) => {
      if (conn && conn.open) conn.send(data);
    });
  };

  const startMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setLocalStream(stream);
      return stream;
    } catch {
      toast.error("Media Error", { description: "Camera and mic access failed." });
      return null;
    }
  };

  const handleJoinRoom = async (roomIdToJoin) => {
    if (!username) {
      toast.error("Username required", { description: "Enter a name to join." });
      return;
    }
    const stream = await startMedia();
    if (!stream) return;

    const conn = myPeer.connect(roomIdToJoin);
    handleNewConnection(conn);

    const call = myPeer.call(roomIdToJoin, stream);
    call.on("stream", (remoteStream) => {
      addRemoteStream(roomIdToJoin, remoteStream, "Host");
    });
    setIsLobby(false);
  };

  const handleCreateRoom = async () => {
    if (!username) {
      toast.error("Username required", { description: "Enter a name to create a room." });
      return;
    }
    await startMedia();
    setIsLobby(false);
    navigate(`/peer-call/${myPeerId}`);
  };

  const handleLeave = () => {
    localStream?.getTracks().forEach((track) => track.stop());
    Object.values(connectionsRef.current).forEach((conn) => conn.close());
    setLocalStream(null);
    setRemoteStreams({});
    connectionsRef.current = {};
    navigate("/peer-call");
    setIsLobby(true);
  };

  const toggleMedia = (type) => {
    if (!localStream) return;
    if (type === "audio") {
      localStream.getAudioTracks().forEach((track) => (track.enabled = !track.enabled));
      setIsAudioMuted((prev) => !prev);
    } else if (type === "video") {
      localStream.getVideoTracks().forEach((track) => (track.enabled = !track.enabled));
      setIsVideoMuted((prev) => !prev);
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    const messageText = e.target.message.value;
    if (!messageText) return;
    const messageData = { type: "chat", data: { text: messageText, sender: username } };
    broadcastData(JSON.stringify(messageData));
    setMessages((prev) => [...prev, { ...messageData.data, sender: "You" }]);
    e.target.reset();
  };

  const sendFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const arrayBuffer = event.target.result;
      const base64Data = arrayBufferToBase64(arrayBuffer);
      const fileInfo = {
        type: "file",
        data: { fileName: file.name, fileType: file.type, fileData: base64Data, sender: username },
      };
      broadcastData(JSON.stringify(fileInfo));
      const url = URL.createObjectURL(new Blob([arrayBuffer], { type: file.type }));
      setMessages((prev) => [...prev, { type: "file", fileName: file.name, url, sender: "You" }]);
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {isLobby ? (
          <Lobby
            username={username}
            setUsername={setUsername}
            myPeerId={myPeerId}
            handleCreateRoom={handleCreateRoom}
            handleJoinRoom={handleJoinRoom}
            paramRoomId={paramRoomId}
          />
        ) : (
          <CallScreen
            localStream={localStream}
            remoteStreams={remoteStreams}
            messages={messages}
            sendMessage={sendMessage}
            sendFile={sendFile}
            handleLeave={handleLeave}
            toggleMedia={toggleMedia}
            isAudioMuted={isAudioMuted}
            isVideoMuted={isVideoMuted}
            myUsername={username}
          />
        )}
      </div>
    </div>
  );
};

const Lobby = ({
  username,
  setUsername,
  myPeerId,
  handleCreateRoom,
  handleJoinRoom,
  paramRoomId,
}) => {
  const [joinId, setJoinId] = useState(paramRoomId || "");

  const copyToClipboard = () => {
    navigator.clipboard.writeText(myPeerId);
    toast.success("Copied!", { description: "Room ID copied to clipboard." });
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <Card className="w-full max-w-md shadow-lg border-border">
        <CardHeader className="text-center space-y-2">
          <VideoIcon className="mx-auto h-10 w-10 text-primary" />
          <CardTitle className="text-2xl font-bold">Peer-to-Peer Video Call</CardTitle>
          <CardDescription>Create a room or join one using a Room ID.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <Input
            placeholder="Enter your name"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="h-10"
          />
          <Button
            onClick={handleCreateRoom}
            disabled={!myPeerId || !username}
            className="w-full h-10 font-semibold"
          >
            Create New Room
          </Button>
          {myPeerId && (
            <div className="flex items-center space-x-2 rounded-md border p-2 bg-muted">
              <span className="flex-1 truncate text-sm font-mono text-muted-foreground">
                {myPeerId}
              </span>
              <Button variant="ghost" size="icon" onClick={copyToClipboard}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          )}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or Join Existing</span>
            </div>
          </div>
          <Input
            placeholder="Enter Room ID to join"
            value={joinId}
            onChange={(e) => setJoinId(e.target.value)}
            className="h-10"
          />
          <Button
            onClick={() => handleJoinRoom(joinId)}
            disabled={!joinId || !username}
            className="w-full h-10 font-semibold"
            variant="secondary"
          >
            Join Room
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

const CallScreen = ({
  localStream,
  remoteStreams,
  messages,
  sendMessage,
  sendFile,
  handleLeave,
  toggleMedia,
  isAudioMuted,
  isVideoMuted,
  myUsername,
}) => {
  const fileInputRef = useRef(null);
  const remotePeers = Object.entries(remoteStreams);
  const allStreams = [
    { id: "local", stream: localStream, username: myUsername, isMuted: true },
    ...remotePeers.map(([peerId, { stream, username }]) => ({
      id: peerId,
      stream,
      username,
      isMuted: false,
    })),
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[85vh]">
      <div className="lg:col-span-3 flex flex-col bg-black/90 rounded-xl p-4">
        <div className="flex-1 grid gap-4 grid-cols-1 md:grid-cols-2">
          {allStreams.map((s) => (
            <VideoPlayer key={s.id} stream={s.stream} username={s.username} isMuted={s.isMuted} />
          ))}
        </div>
        <div className="mt-4 flex justify-center items-center gap-4 bg-black/30 p-2 rounded-full self-center">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => toggleMedia("audio")}
                  variant={isAudioMuted ? "destructive" : "secondary"}
                  size="icon"
                  className="rounded-full h-12 w-12"
                >
                  {isAudioMuted ? <MicOff /> : <Mic />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{isAudioMuted ? "Unmute" : "Mute"}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => toggleMedia("video")}
                  variant={isVideoMuted ? "destructive" : "secondary"}
                  size="icon"
                  className="rounded-full h-12 w-12"
                >
                  {isVideoMuted ? <VideoOff /> : <Video />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{isVideoMuted ? "Start Video" : "Stop Video"}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleLeave}
                  variant="destructive"
                  size="icon"
                  className="rounded-full h-12 w-12"
                >
                  <PhoneOff />
                </Button>
              </TooltipTrigger>
              <TooltipContent>End Call</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <aside className="lg:col-span-1 border rounded-xl flex flex-col bg-card">
        <div className="p-4 border-b font-semibold text-center">Live Chat</div>
        <ScrollArea className="flex-1 p-4 space-y-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex flex-col ${msg.sender === "You" ? "items-end" : "items-start"}`}
            >
              <div className="text-xs mb-1 text-muted-foreground">{msg.sender}</div>
              <div
                className={`max-w-xs px-3 py-2 rounded-lg ${msg.sender === "You" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
              >
                {msg.type === "file" ? (
                  <a
                    href={msg.url}
                    download={msg.fileName}
                    className="flex items-center gap-2 underline"
                  >
                    <Paperclip className="h-4 w-4" /> {msg.fileName}
                  </a>
                ) : (
                  msg.text
                )}
              </div>
            </div>
          ))}
        </ScrollArea>

        <form onSubmit={sendMessage} className="p-2 border-t flex items-center gap-2">
          <Input
            name="message"
            placeholder="Type a message..."
            className="flex-1 bg-background"
            autoComplete="off"
          />
          <input type="file" ref={fileInputRef} onChange={sendFile} className="hidden" />
          <Button
            type="button"
            onClick={() => fileInputRef.current.click()}
            variant="ghost"
            size="icon"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <Button type="submit" variant="ghost" size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </aside>
    </div>
  );
};

export default PeerJSVideoCallPage;
