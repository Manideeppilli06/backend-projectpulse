package com.projectpulse.backend.board;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "board_lists")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BoardList {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private int position;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "board_id")
    private Board board;
}