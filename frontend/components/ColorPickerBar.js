import React from 'react'
import styles from '../styles/ColorPickerBar.module.scss'

function ColorPickerBar({setStrokeStyle}) {
    const colorList = [
        '#e8eaed',
        '#ef4444',
        '#f97316',
        '#eab308',
        '#22c55e',
        '#3b82f6',
        '#8b5cf6',
        '#ec4899',
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
