import React, {useState, useEffect, useRef} from 'react'
import styles from '../styles/BottomRightBar.module.scss'
import infoPanelStyles from '../styles/ShowInfoPanel.module.scss'
import { ThemeContext } from '../context/ThemeContext'
import CustomizedSnackbar from './CustomizedSnackbar';
import {CopyToClipboard} from 'react-copy-to-clipboard';
import CreateTooltip from './CreateTooltip';
import Icon from './Icon';
import dynamic from "next/dynamic";
import {getRoom} from '../utils/getRoom'
import { apiErrorMessage } from '../utils/utils';

const ReactTooltip = dynamic(() => import("react-tooltip"), {
  ssr: false,
});

function BottomRightBar({scale, undo, clearBoard, disabled, setRoomId, roomId}) {
    const { theme, toggle, dark } = React.useContext(ThemeContext);
    const backgroundColor = theme.secondaryColor;
    const color = theme.color;
    const [showJoinRoomPanel, setShowJoinRoomPanel] = useState(false);
    const roomIdRef = useRef(null);
    const [showSnackbar, setShowSnackbar] = useState(false);
    const [button, setButton] = useState(infoPanelStyles.closeBtnDisabled);
    const [snackbarMsg, setSnackbarMsg] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState("success");

    const setButtonStyle = () => {
        if(roomIdRef.current.value === '') {
            setButton(infoPanelStyles.closeBtnDisabled)
        } else {
            setButton(infoPanelStyles.closeBtn)
        }
    }

    const mounted = useRef(false);
    const pending = useRef(false);

    useEffect(() => {
        mounted.current = true;
        return () => { mounted.current = false; };
    }, []);

    const changeRoom = async () => {
        const nextRoom = roomIdRef.current.value.trim().toUpperCase();
        if (!nextRoom || pending.current) return;
        if (roomId === nextRoom) {
            setSnackbarMsg('You are already connected to this room!');
            setShowSnackbar(true);
            setSnackbarSeverity('warning');
            return;
        }
        pending.current = true;
        try {
            const room = await getRoom(nextRoom);
            if (!mounted.current) return;
            setShowJoinRoomPanel(false);
            setButton(infoPanelStyles.closeBtnDisabled);
            await setRoomId(room.roomId);
        } catch (err) {
            if (mounted.current) {
                setSnackbarMsg(apiErrorMessage(err));
                setShowSnackbar(true);
                setSnackbarSeverity('error');
            }
        } finally {
            pending.current = false;
        }
    };

    const copyID = () => {
        setSnackbarMsg('ID Copied to Clipboard!')
        setShowSnackbar(true)
        setSnackbarSeverity("info");
    }

    return (
        <>
            {showJoinRoomPanel && 
                <div className={infoPanelStyles.infoPanel}>
                    <div className={infoPanelStyles.inner}>
                        <div className={infoPanelStyles.top}>
                            <div className={infoPanelStyles.paragraph}>
                                <h1>Enter a room ID</h1>
                                <button type="button" className={infoPanelStyles.close} onClick={() => setShowJoinRoomPanel(false)} aria-label="Close change room panel"><Icon name="close" size={20} /></button>
                            </div>
                        </div>
                        <div className={infoPanelStyles.middle}>
                            <div className={infoPanelStyles.enterId}>
                                <label className={infoPanelStyles.heading} htmlFor="change-room-id">Enter ID:</label>
                                <input id="change-room-id" className={infoPanelStyles.input} placeholder="fkjsldwkwqrn" ref={roomIdRef} onChange={setButtonStyle}/>
                            </div>
                        </div>
                        <div className={infoPanelStyles.bottom}>
                            <button type="button" className={button} onClick={changeRoom} disabled={button === infoPanelStyles.closeBtnDisabled}>Join Room</button>
                        </div>
                    </div>
                </div>
            }
            <div className={styles.bottomRightBar}> 

                {/* Copy Current Room ID */}
                <div>
                    <CopyToClipboard text={roomId} onCopy={copyID}>
                        <button type="button" data-tip data-for='copyRoomAddress' aria-label="Copy ID" className={styles.toggleTheme} style={{background: backgroundColor, color}}>
                            <Icon name="copy" />
                        </button>
                    </CopyToClipboard>
                    <ReactTooltip id='copyRoomAddress' type='info' effect="solid">
                        <span>Copy ID </span>
                    </ReactTooltip>
                </div>

                {/* Change Room */}
                <CreateTooltip
                    id='joinRoom'
                    background={{background: `${backgroundColor}`, color: `${color}`}}
                    action={() => setShowJoinRoomPanel(!showJoinRoomPanel)}
                    stylesClass={styles.toggleTheme}
                    icon={<Icon name="door" />}
                    type={'info'}
                    effect='solid'
                    text={'Change Room'}
                />

                {/* Toggle theme */}
                <CreateTooltip
                    id='toggleTheme'
                    background={{background: backgroundColor, color}}
                    action={toggle}
                    stylesClass={styles.toggleTheme}
                    icon={<Icon name={dark ? 'sun' : 'moon'} />}
                    label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
                    type={'info'}
                    effect='solid'
                    text={'Change Theme'}
                />

                <CreateTooltip
                    id='clearBoard'
                    background={{background: backgroundColor, color}}
                    disabled={disabled}
                    action={() => { if (!disabled) clearBoard(); }}
                    stylesClass={styles.toggleTheme}
                    icon={<Icon name="trash" />}
                    type='info'
                    effect='solid'
                    text='Clear Board for Everyone'
                />

                {/* Undo */}
                <CreateTooltip
                    id='undo'
                    background={{background: backgroundColor, color}}
                    disabled={disabled}
                    action={undo}
                    stylesClass={styles.undo}
                    icon={<Icon name="undo" />}
                    type={`${disabled ? 'error' : 'info'}`}
                    effect='solid'
                    text={'Undo'}
                />

                <div className={styles.scale} style={{background: `${backgroundColor}`, color: `${color}`}}>Scale: {scale.toFixed(1)}</div> 
            </div>

            <CustomizedSnackbar open={showSnackbar} setShowSnackbar={setShowSnackbar} snackbarMsg={snackbarMsg} severity={snackbarSeverity}/>
        </>
    )
}

export default BottomRightBar



