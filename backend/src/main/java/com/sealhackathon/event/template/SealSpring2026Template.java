package com.sealhackathon.event.template;

import com.sealhackathon.event.domain.Criteria;
import com.sealhackathon.event.domain.HackathonEvent;
import com.sealhackathon.event.domain.Prize;
import com.sealhackathon.event.domain.Round;
import com.sealhackathon.event.domain.Track;
import com.sealhackathon.event.domain.enums.PrizeRank;
import com.sealhackathon.event.domain.enums.RoundType;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

/**
 * Seeds SEAL Hackathon Spring 2026 structure: 3 tracks, 2 rounds, rubrics, prizes.
 */
public final class SealSpring2026Template {

    private SealSpring2026Template() {}

    public static void apply(HackathonEvent event) {
        applyTracks(event);
        applyRounds(event);
        applyPrizes(event);
    }

    private static void applyTracks(HackathonEvent event) {
        List<TrackSeed> seeds = List.of(
                new TrackSeed("Bảng A", "Domain-Specific RAG for Healthcare"),
                new TrackSeed("Bảng B", "Domain-Specific RAG for Legal & Compliance"),
                new TrackSeed("Bảng C", "Domain-Specific RAG for Enterprise Knowledge")
        );
        for (TrackSeed seed : seeds) {
            event.getTracks().add(Track.builder()
                    .hackathonEvent(event)
                    .name(seed.name())
                    .topic(seed.topic())
                    .description("SEAL Spring 2026 — " + seed.topic())
                    .maxTeams(8)
                    .build());
        }
    }

    private static void applyRounds(HackathonEvent event) {
        LocalDate competitionDay = event.getStartDate() != null ? event.getStartDate() : LocalDate.of(2026, 4, 12);

        Round preliminary = Round.builder()
                .hackathonEvent(event)
                .roundNumber(1)
                .name("Vòng bảng")
                .roundType(RoundType.PRELIMINARY)
                .startDate(competitionDay.atTime(7, 0))
                .endDate(competitionDay.atTime(15, 30))
                .submissionDeadline(competitionDay.atTime(14, 0))
                .scoringDeadline(competitionDay.atTime(15, 30))
                .advancementCutoff(2)
                .roundWeight(40)
                .build();
        addPreliminaryCriteria(preliminary);
        event.getRounds().add(preliminary);

        Round finalRound = Round.builder()
                .hackathonEvent(event)
                .roundNumber(2)
                .name("Chung kết")
                .roundType(RoundType.FINAL)
                .startDate(competitionDay.atTime(15, 30))
                .endDate(competitionDay.atTime(17, 0))
                .submissionDeadline(competitionDay.atTime(15, 30))
                .scoringDeadline(competitionDay.atTime(17, 0))
                .advancementCutoff(6)
                .roundWeight(60)
                .build();
        addFinalCriteria(finalRound);
        event.getRounds().add(finalRound);
    }

    private static void addPreliminaryCriteria(Round round) {
        List<CriterionSeed> seeds = List.of(
                new CriterionSeed("Tính chính xác và phù hợp với Domain", 30, 0),
                new CriterionSeed("Kiến trúc Agentic RAG & Giải thuật", 30, 1),
                new CriterionSeed("Ý tưởng & Thuyết trình", 15, 2),
                new CriterionSeed("Khả năng thực thi & tính sáng tạo", 15, 3),
                new CriterionSeed("Trải nghiệm người dùng & giao diện tương tác", 10, 4)
        );
        for (CriterionSeed s : seeds) {
            round.getCriteria().add(Criteria.builder()
                    .round(round)
                    .name(s.name())
                    .weight(s.weight())
                    .sortOrder(s.order())
                    .build());
        }
    }

    private static void addFinalCriteria(Round round) {
        List<CriterionSeed> seeds = List.of(
                new CriterionSeed("Chất lượng xử lý & truy xuất dữ liệu", 30, 0),
                new CriterionSeed("Độ tin cậy & chống ảo giác", 20, 1),
                new CriterionSeed("Tư duy Agent & xử lý đa tầng", 20, 2),
                new CriterionSeed("Tính thực tế & tối ưu vận hành", 20, 3),
                new CriterionSeed("Khả năng mở rộng & sáng tạo", 10, 4)
        );
        for (CriterionSeed s : seeds) {
            round.getCriteria().add(Criteria.builder()
                    .round(round)
                    .name(s.name())
                    .weight(s.weight())
                    .sortOrder(s.order())
                    .build());
        }
    }

    private static void applyPrizes(HackathonEvent event) {
        event.getPrizes().add(Prize.builder()
                .hackathonEvent(event)
                .rank(PrizeRank.FIRST)
                .value("7000000")
                .quantity(1)
                .label("Giải Nhất")
                .build());
        event.getPrizes().add(Prize.builder()
                .hackathonEvent(event)
                .rank(PrizeRank.SECOND)
                .value("5000000")
                .quantity(1)
                .label("Giải Nhì")
                .build());
        event.getPrizes().add(Prize.builder()
                .hackathonEvent(event)
                .rank(PrizeRank.THIRD)
                .value("3000000")
                .quantity(1)
                .label("Giải Ba")
                .build());
        event.getPrizes().add(Prize.builder()
                .hackathonEvent(event)
                .rank(PrizeRank.CONSOLATION)
                .value("1500000")
                .quantity(1)
                .label("Khuyến khích")
                .build());
    }

    private record TrackSeed(String name, String topic) {}
    private record CriterionSeed(String name, int weight, int order) {}
}
