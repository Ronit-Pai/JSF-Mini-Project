import React from 'react'
import styles from '../styles/ColorPickerBar.module.scss'
import { ThemeContext } from '../context/ThemeContext'
import { getCanvasColour } from '../utils/canvasColours'

const colours = [
    { name: 'Adaptive ink', colour: null },
    { name: 'Red ink', colour: '#ff6b6b' },
    { name: 'Orange ink', colour: '#ff922b' },
    { name: 'Yellow ink', colour: '#ffd93d' },
    { name: 'Green ink', colour: '#51cf66' },
    { name: 'Blue ink', colour: '#6bcbff' },
    { name: 'Purple ink', colour: '#cc5de8' },
];

function ColorPickerBar({ selectedColour, setSelectedColour }) {
    const { dark } = React.useContext(ThemeContext);

    return (
        <div className={styles.colorPickerBarscss} role="group" aria-label="Drawing colours">
            {colours.map(({ name, colour }) => (
                <button
                    key={name}
                    type="button"
                    aria-label={name}
                    aria-pressed={selectedColour === colour}
                    title={colour === null ? 'Adaptive ink: stays visible in both themes' : name}
                    style={{ background: getCanvasColour(colour, dark) }}
                    onClick={() => setSelectedColour(colour)}
                />
            ))}
        </div>
    )
}

export default ColorPickerBar
