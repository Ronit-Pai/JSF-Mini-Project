import React, { useState, useEffect, useRef, useCallback } from 'react';
import LeftBar from './LeftBar';
import OnlineUsers from './OnlineUsers';
import FileUploader from './FileUploader';
import ShowInfoPanel from './ShowInfoPanel';
import ColorPickerBar from './ColorPickerBar';
import BottomRightBar from './BottomRightBar';
import MoreActionsBar from './MoreActionsBar';
import { ThemeContext } from '../context/ThemeContext';
import { saveAs } from 'file-saver';
import { drawingEvent } from '../utils/boardOperations';
import { getCanvasColour } from '../utils/canvasColours';
import Spinner from './Spinner';

function Canvas({ sendMessage, clearBoard, setRoomId, drawings, roomId, usersList, loading, ready, notify }) {
    const { theme, dark } = React.useContext(ThemeContext);
    const [lineWidth, setLineWidth] = useState(3);
    const [instrument, setInstrument] = useState('pencil');
    const [selectedColour, setSelectedColour] = useState(null);
    const strokeStyle = getCanvasColour(selectedColour, dark);
    const [showFileUploader, setShowFileUploader] = useState(false);
    const [showInfoPanel, setShowInfoPanel] = useState(true);
    const [cursor, setCursor] = useState({ x: 0, y: 0 });
    const [view, setView] = useState({ x: 0, y: 0, scale: 1 });
    const viewRef = useRef(view);
    const canvasContainerRef = useRef(null);
    const canvasRef = useRef(null);
    const pointer = useRef(null);
    const disabled = !drawings.length;

    const redrawCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ratio = window.devicePixelRatio || 1;
        const width = canvasContainerRef.current.clientWidth;
        const height = canvasContainerRef.current.clientHeight;
        canvas.width = Math.round(width * ratio);
        canvas.height = Math.round(height * ratio);
        const context = canvas.getContext('2d');
        context.setTransform(ratio * view.scale, 0, 0, ratio * view.scale, ratio * view.x * view.scale, ratio * view.y * view.scale);
        context.lineCap = 'round';
        context.lineJoin = 'round';
        drawings.forEach(drawing => {
            const points = drawing.points;
            if (!points || !points.length) return;
            context.globalCompositeOperation = drawing.tool === 'eraser' ? 'destination-out' : 'source-over';
            const colour = getCanvasColour(drawing.colour, dark);
            context.strokeStyle = colour;
            context.fillStyle = colour;
            context.lineWidth = drawing.width;
            context.beginPath();
            if (points.length === 1 || points.every(point => point.x === points[0].x && point.y === points[0].y)) {
                context.arc(points[0].x, points[0].y, drawing.width / 2, 0, Math.PI * 2);
                context.fill();
            } else {
                context.moveTo(points[0].x, points[0].y);
                points.slice(1).forEach(point => context.lineTo(point.x, point.y));
                context.stroke();
            }
        });
    }, [drawings, view, dark]);

    useEffect(() => {
        redrawCanvas();
        window.addEventListener('resize', redrawCanvas);
        return () => window.removeEventListener('resize', redrawCanvas);
    }, [redrawCanvas]);

    useEffect(() => {
        if (!ready) pointer.current = null;
    }, [ready]);

    const position = event => {
        const bounds = canvasRef.current.getBoundingClientRect();
        return { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
    };

    const toWorld = point => ({
        x: point.x / viewRef.current.scale - viewRef.current.x,
        y: point.y / viewRef.current.scale - viewRef.current.y
    });

    const updateView = next => {
        viewRef.current = next;
        setView(next);
    };

    const drawSegment = (start, end) => sendMessage({
        points: [toWorld(start), toWorld(end)],
        tool: instrument,
        colour: strokeStyle,
        width: Math.round(lineWidth)
    });

    const onPointerDown = event => {
        if (!ready || pointer.current || (event.button !== 0 && event.button !== 2)) return;
        event.preventDefault();
        const point = position(event);
        setCursor(point);
        pointer.current = { id: event.pointerId, button: event.button, point };
        event.currentTarget.setPointerCapture(event.pointerId);
        if (event.button === 0 && !drawSegment(point, point)) pointer.current = null;
    };

    const onPointerMove = event => {
        const point = position(event);
        setCursor(point);
        const current = pointer.current;
        if (!ready || !current || current.id !== event.pointerId) return;
        if (current.button === 0) {
            if (point.x !== current.point.x || point.y !== current.point.y) {
                if (!drawSegment(current.point, point)) { pointer.current = null; return; }
            }
        } else {
            const previous = viewRef.current;
            updateView({ ...previous, x: previous.x + (point.x - current.point.x) / previous.scale, y: previous.y + (point.y - current.point.y) / previous.scale });
        }
        current.point = point;
    };

    const onPointerUp = event => {
        if (!pointer.current || pointer.current.id !== event.pointerId) return;
        onPointerMove(event);
        pointer.current = null;
        if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    };

    const onMouseWheel = event => {
        if (pointer.current) return;
        const point = position(event);
        const previous = viewRef.current;
        const world = toWorld(point);
        const scale = Math.max(0.1, Math.min(10, previous.scale * Math.exp(-event.deltaY / 500)));
        updateView({ scale, x: point.x / scale - world.x, y: point.y / scale - world.y });
    };

    const save = () => {
        if (disabled) return;
        saveAs(new Blob([JSON.stringify({ drawings }, null, 2)], { type: 'application/json' }), 'canvas.txt');
    };

    const importFile = text => {
        if (!ready) { notify('Connect to a room before importing drawings.'); return; }
        try {
            const result = JSON.parse(text);
            if (!Array.isArray(result.drawings)) throw new Error('Invalid drawing file.');
            const operations = result.drawings.flat().map(drawing => drawingEvent(drawing, 'import'));
            for (const operation of operations) {
                if (!sendMessage(operation)) return;
            }
            notify('Imported drawings added to the shared board.');
        } catch (err) {
            notify(err.message || 'Invalid drawing file.');
        }
    };

    // Neo-brutalism grid: solid dots on a clean background
    const canvasBg = `radial-gradient(circle, rgba(0,0,0,0.12) 1.5px, transparent 1.5px) 0 0 / 28px 28px, ${theme.backgroundColor}`;

    return (
        <div ref={canvasContainerRef} style={{ position: 'relative', zIndex: 1, width: '100vw', height: '100vh' }}>
            {loading && <div style={{ background: theme.backgroundColor, position: 'absolute', zIndex: 99999999, width: '100vw', height: '100vh' }}>
                <Spinner color="#ff6b6b" loading={loading} connecting={true} />
            </div>}
            <ColorPickerBar selectedColour={selectedColour} setSelectedColour={setSelectedColour} />
            <LeftBar save={save} disabled={disabled} importFile={() => setShowFileUploader(true)} />
            <OnlineUsers usersList={usersList} />
            {showFileUploader && <FileUploader setShowFileUploader={setShowFileUploader} setTextReadFromFile={importFile} />}
            {showInfoPanel && <ShowInfoPanel setShowInfoPanel={setShowInfoPanel} />}
            <BottomRightBar
                scale={view.scale}
                undo={() => notify('Undo is not supported by the shared server. Use the eraser or clear the board instead.')}
                clearBoard={clearBoard}
                disabled={disabled || !ready}
                setRoomId={setRoomId}
                roomId={roomId}
            />
            <MoreActionsBar lineWidth={lineWidth} setLineWidth={setLineWidth} setInstrument={setInstrument} instrument={instrument} color={strokeStyle} />
            <canvas
                id="canvas"
                ref={canvasRef}
                style={{ width: '100%', height: '100%', display: 'block', background: canvasBg, touchAction: 'none', cursor: instrument === 'eraser' ? 'none' : 'crosshair' }}
                onContextMenu={event => event.preventDefault()}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={() => { pointer.current = null; }}
                onLostPointerCapture={() => { pointer.current = null; }}
                onWheel={onMouseWheel}
            >Your browser does not support HTML5 canvas</canvas>
            {instrument === 'eraser' && <div style={{
                width: lineWidth * view.scale,
                height: lineWidth * view.scale,
                borderRadius: '50%',
                border: `2px solid #000`,
                position: 'absolute',
                zIndex: 999999999,
                top: cursor.y - lineWidth * view.scale / 2,
                left: cursor.x - lineWidth * view.scale / 2,
                pointerEvents: 'none'
            }} />}
        </div>
    );
}

export default Canvas;
