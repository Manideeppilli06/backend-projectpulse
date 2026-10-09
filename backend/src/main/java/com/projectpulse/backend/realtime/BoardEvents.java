package com.projectpulse.backend.realtime;

import java.util.Map;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@Service
public class BoardEvents {

    private final SimpMessagingTemplate messagingTemplate;

    public BoardEvents(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void publish(Long boardId, String type) {
        String destination = "/topic/boards/" + boardId;
        Object payload = Map.of("type", type);

        Runnable send = () -> messagingTemplate.convertAndSend(destination, payload);

        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    send.run();
                }
            });
        } else {
            send.run();
        }
    }
}