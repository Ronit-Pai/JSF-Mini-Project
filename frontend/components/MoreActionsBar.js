import React, { useState, useRef } from "react";
import { ThemeContext } from "../context/ThemeContext";
import SelectInstrument from "./SelectInstrument";
import Icon from "./Icon";
import styles from "../styles/MoreActionsBar.module.scss";

function MoreActionsBar({lineWidth, setLineWidth, setInstrument, instrument, color}) {
  const { theme } = React.useContext(ThemeContext);
  const [isMenuOpened, setIsMenuOpened] = useState(false);
  const toggleRef = useRef(null);

  const closeMenu = () => {
    setIsMenuOpened(false);
    toggleRef.current.focus();
  };

  return (
    <div
      className={styles.moreActionsBar}
      style={{background: theme.secondaryColor, color: theme.color, height: isMenuOpened ? 180 : 45}}
      onKeyDown={event => {
        if (event.key === "Escape" && isMenuOpened) {
          event.stopPropagation();
          closeMenu();
        }
      }}
    >
      <button
        type="button"
        ref={toggleRef}
        className={styles.menuToggle}
        onClick={() => setIsMenuOpened(!isMenuOpened)}
        aria-label={isMenuOpened ? "Close tools menu" : "Open tools menu"}
        aria-expanded={isMenuOpened}
        aria-controls="drawing-tools"
      >
        <Icon name={isMenuOpened ? "close" : "tools"} />
      </button>
      <div id="drawing-tools" className={styles.menuInner} hidden={!isMenuOpened}>
        {isMenuOpened && <SelectInstrument
          color={color}
          setInstrument={setInstrument}
          instrument={instrument}
          lineWidth={lineWidth}
          setLineWidth={setLineWidth}
        />}
      </div>
    </div>
  );
}

export default MoreActionsBar;
