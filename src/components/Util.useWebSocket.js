import { useEffect, useRef, useState } from "preact/hooks";

/**
 * Custom hook for WebSocket connection
 * @param {string} url - WebSocket URL
 * @param {object} options - Options object
 * @param {function} options.onMessage - Callback for received messages
 * @param {function} options.onOpen - Callback when connection opens
 * @param {function} options.onClose - Callback when connection closes
 * @param {function} options.onError - Callback for errors
 * @param {boolean} options.enabled - Whether the connection should be active (default: true)
 * @returns {object} - { connected, send, reconnect }
 */
export function useWebSocket(url, options = {}) {
    const {
        onMessage,
        onOpen,
        onClose,
        onError,
        enabled = true
    } = options;

    const [connected, setConnected] = useState(false);
    const wsRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);
    const reconnectAttemptsRef = useRef(0);
    const maxReconnectAttempts = 5;
    const reconnectDelay = 3000; // 3 seconds

    const connect = () => {
        if (!enabled || !url) {
            return;
        }

        try {
            // Convert HTTP URL to WebSocket URL
            let wsUrl = url;
            if (!url || url === "") {
                // If no URL provided, use current window location
                if (typeof window !== "undefined") {
                    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
                    wsUrl = `${protocol}//${window.location.host}/ws`;
                } else {
                    console.error("useWebSocket: No URL provided and window is not available");
                    return;
                }
            } else if (url.startsWith("http://")) {
                wsUrl = url.replace("http://", "ws://");
            } else if (url.startsWith("https://")) {
                wsUrl = url.replace("https://", "wss://");
            } else if (!url.startsWith("ws://") && !url.startsWith("wss://")) {
                // If no protocol, assume ws://
                wsUrl = `ws://${url}`;
            }

            // Add WebSocket path if not present
            // Backend uses /ws endpoint (not /ws/connector_config)
            if (!wsUrl.includes("/ws")) {
                // Remove trailing slash if present
                if (wsUrl.endsWith("/")) {
                    wsUrl = wsUrl.slice(0, -1);
                }
                wsUrl = `${wsUrl}/ws`;
            }

            console.log("useWebSocket: Connecting to", wsUrl);
            const ws = new WebSocket(wsUrl);

            ws.onopen = (event) => {
                console.log("useWebSocket: Connected successfully", event);
                console.log("useWebSocket: WebSocket readyState:", ws.readyState, "(1=OPEN)");
                setConnected(true);
                reconnectAttemptsRef.current = 0;
                if (onOpen) {
                    onOpen();
                }
            };

            ws.onerror = (error) => {
                console.error("useWebSocket: WebSocket error event:", error);
                console.error("useWebSocket: WebSocket readyState:", ws.readyState);
                console.error("useWebSocket: WebSocket URL:", wsUrl);
                setConnected(false);
                if (onError) {
                    onError(error);
                }
            };

            ws.onmessage = (event) => {
                console.log("useWebSocket: Received message, length:", event.data?.length);
                try {
                    const data = JSON.parse(event.data);
                    console.log("useWebSocket: Message received", data);
                    if (onMessage) {
                        onMessage(data);
                    }
                } catch (error) {
                    console.error("useWebSocket: Failed to parse message", error, event.data);
                }
            };

            ws.onerror = (error) => {
                console.error("useWebSocket: WebSocket error event:", error);
                console.error("useWebSocket: WebSocket readyState:", ws.readyState, "(0=CONNECTING, 1=OPEN, 2=CLOSING, 3=CLOSED)");
                console.error("useWebSocket: WebSocket URL:", wsUrl);
                console.error("useWebSocket: WebSocket protocol:", ws.protocol);
                console.error("useWebSocket: WebSocket extensions:", ws.extensions);
                setConnected(false);
                if (onError) {
                    onError(error);
                }
            };

            ws.onclose = (event) => {
                console.log("useWebSocket: Disconnected", {
                    code: event.code,
                    reason: event.reason,
                    wasClean: event.wasClean,
                    readyState: ws.readyState
                });
                setConnected(false);
                if (onClose) {
                    onClose();
                }

                // Attempt to reconnect if enabled
                if (enabled && reconnectAttemptsRef.current < maxReconnectAttempts) {
                    reconnectAttemptsRef.current++;
                    console.log(`useWebSocket: Reconnecting (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})...`);
                    reconnectTimeoutRef.current = setTimeout(() => {
                        connect();
                    }, reconnectDelay);
                } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
                    console.error("useWebSocket: Max reconnection attempts reached");
                }
            };

            wsRef.current = ws;
        } catch (error) {
            console.error("useWebSocket: Failed to create WebSocket", error);
            if (onError) {
                onError(error);
            }
        }
    };

    const disconnect = () => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
        setConnected(false);
    };

    const send = (data) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            const message = typeof data === "string" ? data : JSON.stringify(data);
            wsRef.current.send(message);
            return true;
        }
        console.warn("useWebSocket: Cannot send, WebSocket not connected");
        return false;
    };

    const reconnect = () => {
        disconnect();
        reconnectAttemptsRef.current = 0;
        connect();
    };

    useEffect(() => {
        if (enabled) {
            connect();
        } else {
            disconnect();
        }

        return () => {
            disconnect();
        };
    }, [url, enabled]);

    return {
        connected,
        send,
        reconnect,
        disconnect
    };
}

