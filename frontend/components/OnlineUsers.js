import React from 'react'
import styles from '../styles/OnlineUsers.module.scss'
import { ThemeContext } from '../context/ThemeContext'
import Icon from './Icon';

function OnlineUsers({usersList}) {
    const { theme } = React.useContext(ThemeContext)

    return (
        <div className={styles.onlineUsers} style={{background: theme.secondaryColor, color: theme.color}} role="status" aria-label={`${usersList.length} online ${usersList.length === 1 ? 'user' : 'users'}`}>
            <p aria-hidden="true">{usersList.length}</p>
            <Icon name="users" size={20} />
        </div>
    )
}

export default OnlineUsers
