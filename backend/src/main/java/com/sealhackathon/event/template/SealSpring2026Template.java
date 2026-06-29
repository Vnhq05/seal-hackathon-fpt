package com.sealhackathon.event.template;

import com.sealhackathon.event.domain.AllowedEmailDomain;
import com.sealhackathon.event.domain.Criteria;
import com.sealhackathon.event.domain.EventSchedule;
import com.sealhackathon.event.domain.HackathonEvent;
import com.sealhackathon.event.domain.Prize;
import com.sealhackathon.event.domain.Round;
import com.sealhackathon.event.domain.Track;
import com.sealhackathon.event.domain.enums.AdvancementRule;
import com.sealhackathon.event.domain.enums.PrizeRank;
import com.sealhackathon.event.domain.enums.RoundType;
import com.sealhackathon.event.domain.enums.ScheduleGate;
import com.sealhackathon.event.domain.enums.ScheduleType;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Seeds SEAL Hackathon Spring 2026 structure: 3 tracks, 2 rounds, rubrics, prizes, schedule.
 */
public final class SealSpring2026Template {

    private SealSpring2026Template() {}

    public static void apply(HackathonEvent event) {
        applyTracks(event);
        applyRounds(event);
        applyPrizes(event);
    }

    public static List<EventSchedule> buildSchedules(HackathonEvent event) {
        LocalDate regOpen = event.getRegistrationOpenDate() != null
                ? event.getRegistrationOpenDate() : LocalDate.of(2026, 3, 15);
        LocalDate regClose = event.getRegistrationDeadline() != null
                ? event.getRegistrationDeadline() : LocalDate.of(2026, 3, 25);
        LocalDate workshopDay = regClose.plusDays(15);
        LocalDate day1 = event.getStartDate() != null
                ? event.getStartDate().minusDays(1) : LocalDate.of(2026, 4, 11);
        LocalDate day2 = event.getStartDate() != null
                ? event.getStartDate() : LocalDate.of(2026, 4, 12);

        List<EventSchedule> schedules = new ArrayList<>();
        schedules.add(schedule(ScheduleType.WORKSHOP, "Workshop", null,
                workshopDay.atTime(9, 0), workshopDay.atTime(12, 0), null, 0));
        schedules.add(schedule(ScheduleType.OPENING, "Khai mạc & bốc thăm bảng",
                "Đội tự chọn bảng theo lượt; BTC bốc thăm topic cho từng bảng",
                day1.atTime(14, 0), day1.atTime(17, 0), null, 1));
        schedules.add(schedule(ScheduleType.TRACK_DRAW, "Bốc thăm chọn bảng", null,
                day1.atTime(14, 0), day1.atTime(16, 0), null, 2));
        schedules.add(schedule(ScheduleType.MILESTONE, "Milestone 1 — Hoàn thiện ý tưởng & kiến trúc",
                "Thiết kế Agentic RAG architecture",
                day2.atTime(7, 0), day2.atTime(10, 0), ScheduleGate.SLIDE_SUBMISSION, 3));
        schedules.add(schedule(ScheduleType.MILESTONE, "Milestone 2 — Pitching & hoàn thiện sản phẩm",
                "Pitching song song với coding",
                day2.atTime(10, 0), day2.atTime(14, 0), ScheduleGate.DEMO_SUBMISSION, 4));
        schedules.add(schedule(ScheduleType.SCORING, "Chấm vòng bảng",
                "5 phút thuyết trình + 3 phút Q&A",
                day2.atTime(14, 0), day2.atTime(15, 30), null, 5));
        schedules.add(schedule(ScheduleType.FINAL, "Chung kết",
                "7 phút thuyết trình + 3 phút Q&A — Top 6 đội",
                day2.atTime(15, 30), day2.atTime(17, 0), null, 6));
        schedules.add(schedule(ScheduleType.CEREMONY, "Trao giải & bế mạc", null,
                day2.atTime(17, 0), day2.atTime(18, 0), null, 7));
        return schedules;
    }

    public static List<AllowedEmailDomain> buildDefaultEmailDomains() {
        return List.of(
                domain("fpt.edu.vn", "FPT University"),
                domain("fe.edu.vn", "FPT Education"),
                domain("hcmut.edu.vn", "ĐH Bách khoa TP.HCM"),
                domain("hcmus.edu.vn", "ĐH Khoa học Tự nhiên TP.HCM"),
                domain("student.hcmus.edu.vn", "ĐH Khoa học Tự nhiên TP.HCM"),
                domain("uit.edu.vn", "ĐH Công nghệ Thông tin TP.HCM"),
                domain("hcmute.edu.vn", "ĐH Sư phạm Kỹ thuật TP.HCM"),
                domain("ueh.edu.vn", "ĐH Kinh tế TP.HCM"),
                domain("student.ueh.edu.vn", "ĐH Kinh tế TP.HCM")
        );
    }

    private static AllowedEmailDomain domain(String domain, String label) {
        return AllowedEmailDomain.builder()
                .domain(domain)
                .universityLabel(label)
                .build();
    }

    private static EventSchedule schedule(ScheduleType type, String title, String description,
                                          LocalDateTime start, LocalDateTime end,
                                          ScheduleGate gate, int order) {
        return EventSchedule.builder()
                .type(type)
                .title(title)
                .description(description)
                .startTime(start)
                .endTime(end)
                .gate(gate)
                .sortOrder(order)
                .build();
    }

    private static void applyTracks(HackathonEvent event) {
        List<String> names = List.of("Bảng A", "Bảng B", "Bảng C");
        for (String name : names) {
            event.getTracks().add(Track.builder()
                    .hackathonEvent(event)
                    .name(name)
                    .description("SEAL Spring 2026 — " + name)
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
                .slideDeadline(competitionDay.atTime(10, 0))
                .submissionDeadline(competitionDay.atTime(14, 0))
                .scoringDeadline(competitionDay.atTime(15, 30))
                .advancementCutoff(2)
                .advancementRule(AdvancementRule.PER_TRACK_TOP_N)
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
                .advancementRule(AdvancementRule.FINALIST_POOL)
                .roundWeight(60)
                .build();
        addFinalCriteria(finalRound);
        event.getRounds().add(finalRound);
    }

    private static void addPreliminaryCriteria(Round round) {
        List<CriterionSeed> seeds = List.of(
                new CriterionSeed("Tính chính xác và phù hợp với Domain",
                        "Accuracy and Domain Relevance", 30, 0),
                new CriterionSeed("Kiến trúc Agentic RAG & Giải thuật",
                        "Agentic RAG Architecture & Algorithm", 30, 1),
                new CriterionSeed("Ý tưởng & Thuyết trình",
                        "Ideas & Presentation", 15, 2),
                new CriterionSeed("Khả năng thực thi & tính sáng tạo",
                        "Feasibility & Creativity", 15, 3),
                new CriterionSeed("Trải nghiệm người dùng & giao diện tương tác",
                        "User Experience & Interactive Interface", 10, 4)
        );
        for (CriterionSeed s : seeds) {
            round.getCriteria().add(buildCriterion(round, s));
        }
    }

    private static void addFinalCriteria(Round round) {
        List<CriterionSeed> seeds = List.of(
                new CriterionSeed("Chất lượng xử lý & truy xuất dữ liệu",
                        "Data Processing & Retrieval Quality", 30, 0),
                new CriterionSeed("Độ tin cậy & chống ảo giác",
                        "Reliability & Hallucination Resistance", 20, 1),
                new CriterionSeed("Tư duy Agent & xử lý đa tầng",
                        "Agent Reasoning & Multi-hop Processing", 20, 2),
                new CriterionSeed("Tính thực tế & tối ưu vận hành",
                        "Practicality & Operational Optimization", 20, 3),
                new CriterionSeed("Khả năng mở rộng & sáng tạo",
                        "Scalability & Innovation", 10, 4)
        );
        for (CriterionSeed s : seeds) {
            round.getCriteria().add(buildCriterion(round, s));
        }
    }

    private static Criteria buildCriterion(Round round, CriterionSeed s) {
        return Criteria.builder()
                .round(round)
                .name(s.name())
                .description(s.description())
                .weight(s.weight())
                .sortOrder(s.order())
                .minScore(1)
                .maxScore(5)
                .build();
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

    private record CriterionSeed(String name, String description, int weight, int order) {}
}
