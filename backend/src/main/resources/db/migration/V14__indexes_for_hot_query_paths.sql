-- V14: indexes for query methods that currently have none or only a partial one.
-- Each index below backs a real repository method; none duplicates an existing index.

-- MentorChatService.getMessages -> findByTeamIdOrderBySentAtAsc. The table had no index at all.
CREATE NONCLUSTERED INDEX idx_mentor_chat_team_sent
    ON dbo.mentor_chat_messages (team_id, sent_at);
GO

-- LiveScoreBroadcastListener runs findByRoundIdAndVersionOrderByRankAsc on every ranking recalc.
-- Only idx_ranking_round_id (round_id) existed, which cannot serve the version filter or rank order.
-- [rank] is a reserved word, hence the brackets.
CREATE NONCLUSTERED INDEX idx_ranking_round_version_rank
    ON dbo.rankings (round_id, version, [rank]);
GO

-- TeamJoinRequestService.getMyJoinRequests -> findByRequesterIdAndEventId.
CREATE NONCLUSTERED INDEX idx_join_requester_event
    ON dbo.team_join_requests (requester_id, event_id);
GO

-- TeamLeaveRequestService -> findByEventIdAndStatus.
CREATE NONCLUSTERED INDEX idx_leave_event_status
    ON dbo.team_leave_requests (event_id, status);
GO

-- ScoreReviewService -> findByEventFilters(eventId, status). Only the submission_id UK existed.
CREATE NONCLUSTERED INDEX idx_score_review_event_status
    ON dbo.score_review_requests (event_id, status);
GO

-- NotificationService unread badge -> findByUserIdAndChannelAndReadAtIsNull... Only (user_id) existed.
-- INCLUDE notification_id covers the join used to order by the notification's created_at.
CREATE NONCLUSTERED INDEX idx_notif_recipient_user_channel_read
    ON dbo.notification_recipients (user_id, channel, read_at) INCLUDE (notification_id);
GO
