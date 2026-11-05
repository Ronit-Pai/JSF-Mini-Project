import React from 'react'
import styles from '../styles/ShowInfoPanel.module.scss'
import Icon from './Icon';

function ShowInfoPanel({setShowInfoPanel}) {
    const closePanel = () => {
        setShowInfoPanel(false)
    }

    return (
        <div className={styles.infoPanel} onClick={closePanel}>
            <div className={styles.inner} onClick={event => event.stopPropagation()}>
                <div className={styles.top}>
                    <div className={styles.paragraph}>
                        <h1>Whiteboard Controls</h1>
                        <button type="button" className={styles.close} onClick={closePanel} aria-label="Close whiteboard controls"><Icon name="close" size={20} /></button>
                    </div>
                </div>
                <div className={styles.middle}>
                    <div className={styles.paragraph}>
                        <h1 className={styles.heading}>Drawing</h1>
                        <p className={styles.details}><Icon name="mouse" size={18} /> Left Click / <Icon name="touch" size={18} /> Single-finger-touch</p>
                    </div>
                    <div className={styles.paragraph}>
                        <h1 className={styles.heading}>Moving</h1>
                        <p className={styles.details}><Icon name="mouse" size={18} /> Right Click and Drag</p>
                    </div>
                    <div className={styles.paragraph}>
                        <h1 className={styles.heading}>Zooming</h1>
                        <p className={styles.details}><Icon name="mouse" size={18} /> Scroll Wheel</p>
                    </div>
                </div>
                <div className={styles.bottom}>
                    <button type="button" className={styles.closeBtn} onClick={closePanel}>Close</button>
                </div>
            </div>
        </div>
    )
}

export default ShowInfoPanel
