import { useRouter } from 'next/router';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Layout from '../../components/layout';
import Canvas from '../../components/Canvas';
import CustomizedSnackbar from '../../components/CustomizedSnackbar';
import { ThemeProvider } from '../../context/ThemeContext';
import SockJS from 'sockjs-client';
import Stomp from 'stomp-websocket';
import { getRoom } from '../../utils/getRoom';
import { getDrawings } from '../../utils/getDrawings';
import { apiErrorMessage } from '../../utils/utils';
import { newId, drawingEvent, applyDrawingEvent, mergeDrawingHistory } from '../../utils/boardOperations';
import BASE_URL from '../../utils/baseUrl';

export default function Room() {
    const router = useRouter();
    const roomId = typeof router.query.rid === 'string' ? router.query.rid.trim().toUpperCase() : '';
    const displayName = typeof router.query.username === 'string' ? router.query.username.trim() : '';
    const [drawings, setDrawings] = useState([]);
    const [usersList, setUsersList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [ready, setReady] = useState(false);
    const [activeRoom, setActiveRoom] = useState('');
    const [error, setError] = useState('');
    const [attempt, setAttempt] = useState(0);
    const [snackbar, setSnackbar] = useState({ open: false, message: '' });
    const connection = useRef(null);
    const sessionId = useRef(null);

    const notify = useCallback(message => setSnackbar({ open: true, message }), []);

    useEffect(() => {
        if (!router.isReady) return;
        let active = true;
        let client;
        let socket;
        let subscriptions = [];
        let timer;
        let acknowledgementTimer;
        const pending = new Map();
        let replaying = true;
        let buffered = [];
        setActiveRoom(roomId);
        setDrawings([]);
        setUsersList([]);
        setLoading(true);
        setReady(false);
        setError('');
        sessionId.current = newId();

        const close = () => {
            clearTimeout(timer);
            clearInterval(acknowledgementTimer);
            pending.clear();
            if (connection.current && connection.current.client === client) connection.current = null;
            if (client && client.connected) {
                try {
                    client.send(`/app/rooms/${roomId}/presence/leave`, {}, JSON.stringify({ displayName }));
                    subscriptions.forEach(subscription => subscription.unsubscribe());
                    client.disconnect(() => {});
                } catch (err) {
                    // Closing the transport also removes server-side presence.
                }
            }
            subscriptions = [];
            if (socket) socket.close();
        };

        const fail = message => {
            if (!active) return;
            active = false;
            setLoading(false);
            setReady(false);
            setUsersList([]);
            setError(message);
            close();
        };

        if (!roomId || !displayName || displayName.length > 80) {
            fail('A room ID and a username of 1–80 characters are required. Return home to join.');
            return close;
        }

        getRoom(roomId).then(() => {
            if (!active) return;
            socket = new SockJS(`${BASE_URL}/ws`);
            client = Stomp.over(socket);
            client.debug = () => {};
            timer = setTimeout(() => fail('Connection timed out. Check the backend and retry.'), 15000);
            client.connect({}, () => {
                if (!active) { close(); return; }
                clearTimeout(timer);
                subscriptions.push(client.subscribe(`/topic/rooms/${roomId}/drawings`, message => {
                    if (!active) return;
                    try {
                        const event = JSON.parse(message.body);
                        if (event.roomId !== roomId) return;
                        if (event.type === 'board_cleared') pending.clear();
                        else pending.delete(event.operationId);
                        if (replaying) buffered.push(event);
                        else setDrawings(current => applyDrawingEvent(current, event));
                    } catch (err) {
                        fail('Received an invalid drawing update. Retry to reload the board.');
                    }
                }));
                subscriptions.push(client.subscribe(`/topic/rooms/${roomId}/presence`, message => {
                    if (!active) return;
                    try {
                        const event = JSON.parse(message.body);
                        setUsersList(event.participants || []);
                        notify(`${event.displayName} ${event.type === 'left' ? 'left' : 'joined'} the room.`);
                    } catch (err) {
                        fail('Received an invalid presence update. Please retry.');
                    }
                }));
                client.send(`/app/rooms/${roomId}/presence/join`, {}, JSON.stringify({ displayName }));
                // Buffer live events while loading persisted operations, then deduplicate their IDs.
                getDrawings(roomId).then(history => {
                    if (!active) return;
                    if (!Array.isArray(history)) throw new Error('Invalid drawing history');
                    setDrawings(mergeDrawingHistory(history, buffered));
                    buffered = [];
                    replaying = false;
                    connection.current = { client, roomId, fail, pending };
                    acknowledgementTimer = setInterval(() => {
                        if (Array.from(pending.values()).some(sentAt => Date.now() - sentAt > 15000)) {
                            fail('The server has not confirmed an update. Retry to reload saved drawings; some changes may not have been saved.');
                        }
                    }, 1000);
                    setLoading(false);
                    setReady(true);
                }).catch(err => fail(apiErrorMessage(err, 'Could not load the board. Please retry.')));
            }, () => fail('Realtime connection lost. Retry to reload saved drawings; unconfirmed strokes may not have been saved.'));
        }).catch(err => fail(apiErrorMessage(err)));

        const beforeUnload = () => { active = false; close(); };
        window.addEventListener('beforeunload', beforeUnload);
        return () => {
            active = false;
            window.removeEventListener('beforeunload', beforeUnload);
            close();
        };
    }, [router.isReady, roomId, displayName, attempt, notify]);

    const publish = (destination, payload) => {
        const current = connection.current;
        if (!current || current.roomId !== roomId || !current.client.connected) {
            notify('Not connected. Wait for the board to load or retry the connection.');
            return false;
        }
        try {
            current.pending.set(payload.operationId || 'clear', Date.now());
            current.client.send(`/app/rooms/${roomId}/${destination}`, {}, JSON.stringify(payload));
            return true;
        } catch (err) {
            current.fail('Could not send the update. Retry to reload saved drawings.');
            return false;
        }
    };

    const sendMessage = drawing => {
        try {
            const operation = drawingEvent(drawing, sessionId.current);
            if (!publish('draw', operation)) return false;
            setDrawings(current => applyDrawingEvent(current, { ...operation, roomId }));
            return true;
        } catch (err) {
            notify(err.message);
            return false;
        }
    };

    const clearBoard = () => {
        if (window.confirm('Clear the board for everyone? This cannot be undone.')) {
            // Wait for the persisted clear event before removing local operations.
            publish('clear', { sessionId: sessionId.current });
        }
    };

    const setRoomId = newId => router.push({
        pathname: '/room/[rid]',
        query: { rid: newId, username: displayName }
    });

    return (
        <Layout>
            <ThemeProvider>
                <Canvas
                    key={`${roomId}:${displayName}`}
                    sendMessage={sendMessage}
                    clearBoard={clearBoard}
                    setRoomId={setRoomId}
                    drawings={activeRoom === roomId ? drawings : []}
                    roomId={roomId}
                    usersList={activeRoom === roomId ? usersList : []}
                    loading={loading}
                    ready={ready && activeRoom === roomId}
                    notify={notify}
                />
                {error && <div role="alert" style={{ position: 'absolute', top: 60, left: '10%', width: '80%', zIndex: 100000000, background: '#fff', color: '#222', padding: 16 }}>
                    <p>{error}</p>
                    <button onClick={() => setAttempt(value => value + 1)}>Retry connection</button>{' '}
                    <button onClick={() => router.push('/')}>Return home</button>
                </div>}
                <CustomizedSnackbar
                    open={snackbar.open}
                    setShowSnackbar={open => setSnackbar(current => ({ ...current, open }))}
                    snackbarMsg={snackbar.message}
                    severity="info"
                    transition="left"
                    verticalAnchor="top"
                    horizontalAnchor="right"
                />
            </ThemeProvider>
        </Layout>
    );
}

export async function getServerSideProps() {
    return { props: {} };
}
