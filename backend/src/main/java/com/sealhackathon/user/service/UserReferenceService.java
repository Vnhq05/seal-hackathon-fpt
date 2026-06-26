package com.sealhackathon.user.service;

import com.sealhackathon.event.repository.EventJudgeAssignmentRepository;
import com.sealhackathon.event.repository.JudgeAssignmentRepository;
import com.sealhackathon.event.repository.MentorAssignmentRepository;
import com.sealhackathon.judging.repository.JudgeScoreRepository;
import com.sealhackathon.judging.repository.TeamJudgeAssignmentRepository;
import com.sealhackathon.team.repository.EventEnrollmentRepository;
import com.sealhackathon.team.repository.MentorInvitationRepository;
import com.sealhackathon.team.repository.MentorTeamRepository;
import com.sealhackathon.team.repository.TeamMemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserReferenceService {

    private final MentorAssignmentRepository mentorAssignmentRepository;
    private final EventJudgeAssignmentRepository eventJudgeAssignmentRepository;
    private final JudgeAssignmentRepository judgeAssignmentRepository;
    private final JudgeScoreRepository judgeScoreRepository;
    private final TeamJudgeAssignmentRepository teamJudgeAssignmentRepository;
    private final MentorTeamRepository mentorTeamRepository;
    private final MentorInvitationRepository mentorInvitationRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final EventEnrollmentRepository eventEnrollmentRepository;

    public boolean hasReferences(UUID userId) {
        return !describeReferences(userId).isEmpty();
    }

    public List<String> describeReferences(UUID userId) {
        List<String> refs = new ArrayList<>();

        long mentorAssignments = mentorAssignmentRepository.countByMentorUserId(userId);
        if (mentorAssignments > 0) {
            refs.add(mentorAssignments + " event mentor assignment(s)");
        }

        long eventJudgeAssignments = eventJudgeAssignmentRepository.countByJudgeUserId(userId);
        if (eventJudgeAssignments > 0) {
            refs.add(eventJudgeAssignments + " event judge assignment(s)");
        }

        long roundJudgeAssignments = judgeAssignmentRepository.countByJudgeUserId(userId);
        if (roundJudgeAssignments > 0) {
            refs.add(roundJudgeAssignments + " round judge assignment(s)");
        }

        long teamJudgeAssignments = teamJudgeAssignmentRepository.countByJudgeUserId(userId);
        if (teamJudgeAssignments > 0) {
            refs.add(teamJudgeAssignments + " team judge assignment(s)");
        }

        long judgeScores = judgeScoreRepository.countByJudgeUserId(userId);
        if (judgeScores > 0) {
            refs.add(judgeScores + " judge score(s)");
        }

        long mentorTeams = mentorTeamRepository.countByMentorUserId(userId);
        if (mentorTeams > 0) {
            refs.add(mentorTeams + " mentor-team link(s)");
        }

        long mentorInvitations = mentorInvitationRepository.countByMentorUserId(userId);
        if (mentorInvitations > 0) {
            refs.add(mentorInvitations + " mentor invitation(s)");
        }

        long teamMemberships = teamMemberRepository.countByUserId(userId);
        if (teamMemberships > 0) {
            refs.add(teamMemberships + " team membership(s)");
        }

        long enrollments = eventEnrollmentRepository.countByUserId(userId);
        if (enrollments > 0) {
            refs.add(enrollments + " event enrollment(s)");
        }

        return refs;
    }
}
