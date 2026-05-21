import { Button, HStack, VStack } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import ProgressBar from "./ProgressBar.jsx";

export default function ReanalyzeButton() {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("Idle");

  const socketRef = useRef(null);

  useEffect(() => {
    const wsUrl = "ws://192.168.0.246:8000/ws/reanalyze";

    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
        setStatus("Connected")
      console.log("WebSocket connection established.");
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("Live Progress Data:", data);

      // Dynamically update UI state based on the payload type
      if (data.type === "progress" && data.percent !== undefined) {
        setProgress(data.percent);
        setStatus(`Reanalyzing r/${data.subreddit}...`);
      } else if (
        data.type === "status" ||
        data.type === "info" ||
        data.type === "warning"
      ) {
        setStatus(data.message);
      } else if (data.type === "complete") {
        setProgress(100);
        setStatus(data.message);
      }
    };

    socket.onerror = (error) => {
      console.error("WebSocket Error:", error);
      setStatus("Connection Error");
    };

    return () => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, []);

  // Helper function to fire actions safely
  const sendAction = (actionName) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({ action: actionName, open_page: false }),
      );
    } else {
      console.error("Cannot send command: WebSocket is disconnected.");
    }
  };

  return (
    <VStack>
      <HStack
        width="full"
        gap="1"
        justifyContent="center"
        alignItems="baseline"
      >
        <ProgressBar value={progress} processingStatus={status} />
      </HStack>
      <HStack>
        <Button
          size="xs"
          color="white"
          fontWeight="black"
          bg="orange.600"
          marginBottom={2}
          onClick={() => sendAction("start")}
        >
          Reanalyze
        </Button>
        <Button
          size="xs"
          color="white"
          fontWeight="black"
          bg="orange.600"
          marginBottom={2}
          onClick={() => sendAction("pause")}
        >
          Pause
        </Button>
        <Button
          size="xs"
          color="white"
          fontWeight="black"
          bg="orange.600"
          marginBottom={2}
          onClick={() => sendAction("resume")}
        >
          Resume
        </Button>
        <Button
          size="xs"
          color="white"
          fontWeight="black"
          bg="orange.600"
          marginBottom={2}
          onClick={() => sendAction("stop")}
        >
          Stop
        </Button>
      </HStack>
    </VStack>
  );
}
