import React, { useState, useRef } from "react";
import { ThemeContext } from "../context/ThemeContext";
import Icon from "./Icon";
import styles from "../styles/SelectInstrument.module.scss";

const thicknesses = [3, 10, 15, 20, 25, 30, 35, 40];

function SelectInstrument({setInstrument, instrument, lineWidth, setLineWidth, color}) {
  const { theme } = React.useContext(ThemeContext);
  const [showPencilMenu, setShowPencilMenu] = useState(false);
  const pencilRef = useRef(null);

  return (
    <div className={styles.selectInstrument}>
      <div
        className={styles.pencilGroup}
        onKeyDown={event => {
          if (event.key === "Escape" && showPencilMenu) {
            event.stopPropagation();
            setShowPencilMenu(false);
            pencilRef.current.focus();
          }
        }}
      >
        <button
          type="button"
          ref={pencilRef}
          className={styles.instrument}
          aria-label="Pencil"
          aria-pressed={instrument === "pencil"}
          aria-expanded={showPencilMenu}
          aria-controls="pencil-thickness"
          onClick={() => {
            setInstrument("pencil");
            setShowPencilMenu(!showPencilMenu);
          }}
        >
          <Icon name="pencil" />
        </button>
        <div
          id="pencil-thickness"
          className={styles.pencilMenu}
          style={{background: theme.secondaryColor, color: theme.color}}
          role="group"
          aria-label="Pencil thickness"
          hidden={!showPencilMenu}
        >
          {thicknesses.map(thickness => (
            <button
              key={thickness}
              type="button"
              className={styles.thickness}
              aria-label={`Pencil thickness ${thickness}`}
              aria-pressed={lineWidth === thickness}
              onClick={() => setLineWidth(thickness)}
            >
              <span
                className={styles.dot}
                style={{width: thickness, height: thickness, background: lineWidth === thickness ? color : theme.backgroundColor}}
              />
            </button>
          ))}
        </div>
      </div>
      <button
        type="button"
        className={styles.instrument}
        aria-label="Eraser"
        aria-pressed={instrument === "eraser"}
        onClick={() => {
          setInstrument("eraser");
          setShowPencilMenu(false);
        }}
      >
        <Icon name="eraser" />
      </button>
    </div>
  );
}

export default SelectInstrument;
