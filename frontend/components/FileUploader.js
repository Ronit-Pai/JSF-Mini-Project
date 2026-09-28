import React, {useState, useRef, useEffect} from 'react'
import styles from '../styles/FileUploader.module.scss'


function FileUploader({setShowFileUploader, setTextReadFromFile}) {
    const [message, setMessage] = useState('Please upload a file!');

    const readerRef = useRef(null);

    useEffect(() => () => {
        const reader = readerRef.current;
        if (reader) {
            reader.onload = null;
            reader.onerror = null;
            if (reader.readyState === 1) reader.abort();
        }
    }, []);

    const showFile = event => {
        const file = event.target.files[0];
        if (!file) return;
        if (readerRef.current && readerRef.current.readyState === 1) readerRef.current.abort();
        const reader = new FileReader();
        readerRef.current = reader;
        reader.onload = e => {
            setTextReadFromFile(e.target.result);
            setShowFileUploader(false);
        };
        reader.onerror = () => setMessage('Could not read the file. Please try again.');
        reader.readAsText(file);
    };

    const closeFileUploader = () => {
        setShowFileUploader(false);
    }

    return (
        <div className={styles.fileUploader}>
            <input type="file" onChange={showFile}/>
            <div id="show-text">{message}</div>
            <div className={styles.icon} onClick={closeFileUploader}>Cancel</div>
        </div>
    );
}

export default FileUploader
