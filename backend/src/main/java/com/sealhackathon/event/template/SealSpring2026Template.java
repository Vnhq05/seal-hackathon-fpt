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

import java.util.Map;



/**

 * Seeds SEAL Hackathon Spring 2026 structure: 3 tracks, 2 rounds, rubrics, prizes, schedule.

 */

public final class SealSpring2026Template {



    private SealSpring2026Template() {}



    public static final String EVENT_DESCRIPTION = "SEAL Hackathon Spring 2026 — Agentic RAG";



    private static final List<String> TRACK_NAMES = List.of("Track A", "Track B", "Track C");



    private static final List<CriterionSeed> PRELIM_SEEDS = List.of(

            new CriterionSeed("Accuracy and Domain Relevance", "Accuracy and Domain Relevance", 30, 0),

            new CriterionSeed("Agentic RAG Architecture & Algorithm", "Agentic RAG Architecture & Algorithm", 30, 1),

            new CriterionSeed("Ideas & Presentation", "Ideas & Presentation", 15, 2),

            new CriterionSeed("Feasibility & Creativity", "Feasibility & Creativity", 15, 3),

            new CriterionSeed("User Experience & Interactive Interface", "User Experience & Interactive Interface", 10, 4)

    );



    private static final List<CriterionSeed> FINAL_SEEDS = List.of(

            new CriterionSeed("Data Processing & Retrieval Quality", "Data Processing & Retrieval Quality", 30, 0),

            new CriterionSeed("Reliability & Hallucination Resistance", "Reliability & Hallucination Resistance", 20, 1),

            new CriterionSeed("Agent Reasoning & Multi-hop Processing", "Agent Reasoning & Multi-hop Processing", 20, 2),

            new CriterionSeed("Practicality & Operational Optimization", "Practicality & Operational Optimization", 20, 3),

            new CriterionSeed("Scalability & Innovation", "Scalability & Innovation", 10, 4)

    );



    public static Map<String, String> trackNameMap() {

        return Map.of("A", "Track A", "B", "Track B", "C", "Track C");

    }



    public static List<String> prelimCriteriaNames() {

        return PRELIM_SEEDS.stream().map(CriterionSeed::name).toList();

    }



    public static List<String> finalCriteriaNames() {

        return FINAL_SEEDS.stream().map(CriterionSeed::name).toList();

    }



    public static Map<PrizeRank, String> prizeLabels() {

        return Map.of(

                PrizeRank.FIRST, "First Prize",

                PrizeRank.SECOND, "Second Prize",

                PrizeRank.THIRD, "Third Prize",

                PrizeRank.CONSOLATION, "Consolation Prize");

    }



    public static void apply(HackathonEvent event, int maxTeamsPerTrack, int topPerTrack, int finalistCount) {

        applyTracks(event, maxTeamsPerTrack);

        applyRounds(event, topPerTrack, finalistCount);

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

        schedules.add(schedule(ScheduleType.OPENING, "Opening & track draw",

                "Teams pick tracks in turn; organizers draw topics per track",

                day1.atTime(14, 0), day1.atTime(17, 0), null, 1));

        schedules.add(schedule(ScheduleType.TRACK_DRAW, "Track selection draw", null,

                day1.atTime(14, 0), day1.atTime(16, 0), null, 2));

        schedules.add(schedule(ScheduleType.MILESTONE, "Milestone 1 — Idea & architecture completion",

                "Design Agentic RAG architecture",

                day2.atTime(7, 0), day2.atTime(10, 0), ScheduleGate.SLIDE_SUBMISSION, 3));

        schedules.add(schedule(ScheduleType.MILESTONE, "Milestone 2 — Pitching & product completion",

                "Parallel pitching and coding",

                day2.atTime(10, 0), day2.atTime(14, 0), ScheduleGate.DEMO_SUBMISSION, 4));

        schedules.add(schedule(ScheduleType.SCORING, "Preliminary scoring",

                "5-minute presentation + 3-minute Q&A",

                day2.atTime(14, 0), day2.atTime(15, 30), null, 5));

        schedules.add(schedule(ScheduleType.FINAL, "Finals",

                "7-minute presentation + 3-minute Q&A — Top 6 teams",

                day2.atTime(15, 30), day2.atTime(17, 0), null, 6));

        schedules.add(schedule(ScheduleType.CEREMONY, "Awards & closing ceremony", null,

                day2.atTime(17, 0), day2.atTime(18, 0), null, 7));

        return schedules;

    }



    public static List<AllowedEmailDomain> buildDefaultEmailDomains() {

        return List.of(

                domain("fpt.edu.vn", "FPT University"),

                domain("fe.edu.vn", "FPT Education"),

                domain("hcmut.edu.vn", "Ho Chi Minh City University of Technology"),

                domain("hcmus.edu.vn", "Vietnam National University Ho Chi Minh City - University of Science"),

                domain("student.hcmus.edu.vn", "Vietnam National University Ho Chi Minh City - University of Science"),

                domain("uit.edu.vn", "University of Information Technology"),

                domain("hcmute.edu.vn", "Ho Chi Minh City University of Education and Technology"),

                domain("ueh.edu.vn", "University of Economics Ho Chi Minh City"),

                domain("student.ueh.edu.vn", "University of Economics Ho Chi Minh City"),

                domain("student.iuh.edu.vn", "Industrial University of Ho Chi Minh City")

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



    private static void applyTracks(HackathonEvent event, int maxTeamsPerTrack) {

        for (String name : TRACK_NAMES) {

            event.getTracks().add(Track.builder()

                    .hackathonEvent(event)

                    .name(name)

                    .description("SEAL Spring 2026 — " + name)

                    .maxTeams(maxTeamsPerTrack)

                    .build());

        }

    }



    private static void applyRounds(HackathonEvent event, int topPerTrack, int finalistCount) {

        LocalDate competitionDay = event.getStartDate() != null ? event.getStartDate() : LocalDate.of(2026, 4, 12);



        Round preliminary = Round.builder()

                .hackathonEvent(event)

                .roundNumber(1)

                .name("Preliminary Round")

                .roundType(RoundType.PRELIMINARY)

                .startDate(competitionDay.atTime(7, 0))

                .endDate(competitionDay.atTime(15, 30))

                .slideDeadline(competitionDay.atTime(10, 0))

                .submissionDeadline(competitionDay.atTime(14, 0))

                .scoringDeadline(competitionDay.atTime(15, 30))

                .advancementCutoff(topPerTrack)

                .advancementRule(AdvancementRule.PER_TRACK_TOP_N)

                .roundWeight(40)

                .build();

        addPreliminaryCriteria(preliminary);

        event.getRounds().add(preliminary);



        Round finalRound = Round.builder()

                .hackathonEvent(event)

                .roundNumber(2)

                .name("Finals")

                .roundType(RoundType.FINAL)

                .startDate(competitionDay.atTime(15, 30))

                .endDate(competitionDay.atTime(17, 0))

                .submissionDeadline(competitionDay.atTime(15, 30))

                .scoringDeadline(competitionDay.atTime(17, 0))

                .advancementCutoff(finalistCount)

                .advancementRule(AdvancementRule.FINALIST_POOL)

                .roundWeight(60)

                .build();

        addFinalCriteria(finalRound);

        event.getRounds().add(finalRound);

    }



    private static void addPreliminaryCriteria(Round round) {

        for (CriterionSeed s : PRELIM_SEEDS) {

            round.getCriteria().add(buildCriterion(round, s));

        }

    }



    private static void addFinalCriteria(Round round) {

        for (CriterionSeed s : FINAL_SEEDS) {

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

        List<PrizeData> prizeData = List.of(

                new PrizeData(PrizeRank.FIRST, "7000000"),

                new PrizeData(PrizeRank.SECOND, "5000000"),

                new PrizeData(PrizeRank.THIRD, "3000000"),

                new PrizeData(PrizeRank.CONSOLATION, "1500000")

        );

        for (PrizeData pd : prizeData) {

            event.getPrizes().add(Prize.builder()

                    .hackathonEvent(event)

                    .rank(pd.rank())

                    .value(pd.value())

                    .quantity(1)

                    .label(prizeLabels().get(pd.rank()))

                    .build());

        }

    }



    private record CriterionSeed(String name, String description, int weight, int order) {}



    private record PrizeData(PrizeRank rank, String value) {}

}

