import React, {useState, useEffect, useRef} from 'react'
import styles from '../styles/ShowInfoPanel.module.scss'
import CustomizedSnackbar from './CustomizedSnackbar';
import {createRoom} from '../utils/createRoom';
import { useRouter } from 'next/router'
import Spinner from './Spinner';
import { getRoom } from '../utils/getRoom';
import { apiErrorMessage } from '../utils/utils';

function ShowChooseNamePanel() {
    const router = useRouter()

    const [button, setButton] = useState(styles.closeBtnDisabled);
    const [open, setOpen] = useState(false);
    const [snackbarMsg, setSnackbarMsg] = useState('');
    const [username, setUsername] = useState('')
    const [roomName, setRoomName] = useState('')
    const [roomAddress, setRoomAddress] = useState('')
    const [showCreateRoom, setShowCreateRoom] = useState(true);
    const [loading, setLoading] = useState(false);
    const [snackbarSeverity, setSnackbarSeverity] = useState("success");
    const [connecting, setConnecting] = useState(false);

    const usernameRef = useRef(null);
    const roomNameRef = useRef(null);
    const roomAddressRef = useRef(null);

    const handleInputChange = (e) => {
        setUsername(e.target.value)
    }

    const handleRoomNameChange = (e) => {
        setRoomName(e.target.value)
    }

    const handleRoomAddressChange = (e) => {
        setRoomAddress(e.target.value)
    }

    const mounted = useRef(false);
    const pending = useRef(false);

    useEffect(() => {
        mounted.current = true;
        return () => { mounted.current = false; };
    }, []);

    useEffect(() => {
        const validName = username.trim().length > 0 && username.trim().length <= 80;
        const validRoom = showCreateRoom ? roomName.trim().length > 0 && roomName.trim().length <= 100 : roomAddress.trim().length > 0;
        setButton(validName && validRoom ? styles.closeBtn : styles.closeBtnDisabled);
    }, [username, roomName, roomAddress, showCreateRoom]);

    const openSbackbar = (msg) => {
        setOpen(true);
        setSnackbarMsg(msg);
    }

    const enterRoom = async create => {
        if (button === styles.closeBtnDisabled || pending.current) return;
        pending.current = true;
        setLoading(true);
        setConnecting(!create);
        try {
            const room = create ? await createRoom(roomName, username) : await getRoom(roomAddress);
            if (!mounted.current) return;
            await router.push({ pathname: '/room/[rid]', query: { rid: room.roomId, username: username.trim() } });
        } catch (err) {
            if (mounted.current) {
                setSnackbarSeverity('error');
                openSbackbar(apiErrorMessage(err));
            }
        } finally {
            pending.current = false;
            if (mounted.current) setLoading(false);
        }
    };

    const handleCreateRoom = () => enterRoom(true);
    const handleJoinRoom = () => enterRoom(false);

    const changePanel = () => {
        setShowCreateRoom(!showCreateRoom)
        setButton(styles.closeBtnDisabled)
    }

    return (
        <>
            {loading
                ?   <Spinner
                        color={'#6c63ff'} 
                        loading={loading}
                        connecting={connecting}
                    />
                :   <div className={styles.infoPanel}>
                        <div className={styles.inner}>
                            <div className={styles.top}>
                                <div className={styles.tabs}>
                                    <p style={{borderBottom: showCreateRoom ? '2px solid #6c63ff' : 'none'}} onClick={changePanel}>Create a Room</p>
                                    <p style={{borderBottom: !showCreateRoom ? '2px solid #6c63ff' : 'none'}} onClick={changePanel}>Join Existing Room</p>
                                </div>
                            </div>
                            <div className={styles.middle}>
                                <div className={styles.enterUsername}>
                                    <p>Pick a username: 👉 </p>
                                    <input className={styles.input} placeholder="Username" value={username} maxLength={80} ref={usernameRef} onChange={handleInputChange}/>
                                </div>
                                {showCreateRoom
                                    ?   <>
                                            <div className={styles.enterUsername}>
                                                <p>Pick a room name: 👉</p>
                                                <input className={styles.input} placeholder="Room Name" value={roomName} maxLength={100} ref={roomNameRef} onChange={handleRoomNameChange}/>
                                            </div>
                                        </>
                                    :   <div className={styles.enterUsername}>
                                            <p>Enter Room Address: 👉</p>
                                            <input className={styles.input} placeholder="Room Address" value={roomAddress} ref={roomAddressRef} onChange={handleRoomAddressChange}/>
                                        </div>
                                }
                            </div>
                            <div className={styles.bottom}>
                                {showCreateRoom
                                    ?   <div className={button} onClick={handleCreateRoom}>Create Room</div>
                                    :   <div className={button} onClick={handleJoinRoom}>Join Room</div>                      
                                }
                            </div>
                        </div>
                    </div>
            }
            <CustomizedSnackbar open={open} setShowSnackbar={setOpen} snackbarMsg={snackbarMsg} severity={snackbarSeverity}/>
        </>

    )
}

export default ShowChooseNamePanel
