import React from 'react'
import styles from '../styles/ColorPickerBar.module.scss'

function ColorPickerBar({setStrokeStyle}) {
    const colorList = [
        '#1a1a2e',
        '#ff6b6b',
        '#ff922b',
        '#ffd93d',
        '#51cf66',
        '#6bcbff',
        '#cc5de8',
        '#ffffff',
    ];

    const changeStrokeStyle = (color) => {
        setStrokeStyle(color);
    }

    return (
        <div className={styles.colorPickerBarscss}>
            {colorList.map((color, index) => 
                <div 
                    key={index}
                    style={{background: `${color}`}}
                    onClick={() => changeStrokeStyle(color)}
                />)}
        </div>
    )
}

export default ColorPickerBar
