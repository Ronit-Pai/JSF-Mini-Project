package com.project.whiteboard.config;
import com.project.whiteboard.service.PresenceService;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;
@Component
public class WebSocketEvents {
    private final PresenceService presence;
    public WebSocketEvents(PresenceService presence) { this.presence = presence; }
    @EventListener public void disconnected(SessionDisconnectEvent event) { presence.disconnect(event.getSessionId()); }
}
