import React from 'react'
import styles from '../styles/LeftBar.module.scss'
import { ThemeContext } from '../context/ThemeContext'
import CreateTooltip from './CreateTooltip';
import Icon from './Icon';

function LeftBar({save, disabled, importFile}) {
    const { theme } = React.useContext(ThemeContext)
    const backgroundColor = theme.secondaryColor;

    return (
        <div className={styles.leftbar}>
            <CreateTooltip
                id='save'
                background={{background: backgroundColor, color: theme.color}}
                action={save}
                disabled={disabled}
                icon={<Icon name="save" />}
                type={`${disabled ? 'error' : 'info'}`}
                effect='solid'
                text={'Save Canvas'}
            />

            <CreateTooltip
                id='import'
                background={{background: backgroundColor, color: theme.color}}
                action={importFile}
                icon={<Icon name="upload" />}
                type={'info'}
                effect='solid'
                text={'Import Canvas'}
            />
        </div>
    )
}

export default LeftBar
