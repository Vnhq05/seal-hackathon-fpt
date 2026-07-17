-- Rewrites participant feedback comments for COMPLETED events into varied English text.
-- Idempotent: re-running just reassigns the same pool of comments.
-- overall_rating is aligned with the sentiment of each comment (3..5).

SET NOCOUNT ON;
SET XACT_ABORT ON;

BEGIN TRANSACTION;

DECLARE @now DATETIME2 = SYSUTCDATETIME();

DECLARE @comments TABLE (idx INT PRIMARY KEY, rating INT NOT NULL, comment NVARCHAR(1000) NOT NULL);
INSERT INTO @comments (idx, rating, comment) VALUES
(0, 5, N'Fantastic experience overall. The judging criteria were transparent from day one and the mentor check-ins kept our team on track throughout the sprint.'),
(1, 5, N'One of the best organized hackathons I have joined. Submission deadlines were clear, the platform never went down, and results were published quickly.'),
(2, 4, N'Really enjoyed the challenge design. The RAG-focused problem statements pushed us to learn new techniques. Would love slightly longer breaks between rounds next time.'),
(3, 5, N'The mentor feedback after each round was genuinely actionable. We reworked our retrieval pipeline based on it and it made a huge difference in the final demo.'),
(4, 4, N'Great event with a supportive community. The Discord channel was active and organizers answered questions within minutes. Venue Wi-Fi could be more stable.'),
(5, 5, N'Loved how the scoring rubric was shared before submissions opened. Knowing exactly what judges were looking for made our planning much more focused.'),
(6, 4, N'Solid competition format. The group stage made judging feel fair since every team got comparable attention. Some criteria descriptions could use concrete examples.'),
(7, 5, N'The judges asked sharp, fair questions during the demo session. It felt less like an exam and more like a real product review. Learned a lot.'),
(8, 3, N'Decent event but the schedule slipped on demo day and our slot moved twice. Content and mentorship were good; logistics need tightening.'),
(9, 5, N'Exceptional mentorship quality. Our mentor helped us scope down an overly ambitious idea into something we could actually ship in 48 hours.'),
(10, 4, N'Well run from registration to awards. I especially appreciated the anonymized score breakdown we received afterwards. More snacks next time please!'),
(11, 5, N'The multi-round structure kept the pressure realistic without burning us out. Progress feedback between rounds was the highlight for me.'),
(12, 4, N'Good balance between competition and learning. The workshop before round one on evaluation metrics was surprisingly useful for our final submission.'),
(13, 5, N'Everything felt professional: clear rules, responsive organizers, and a results announcement that actually explained the winning teams'' strengths.'),
(14, 3, N'The problem statement was interesting but the dataset arrived late, which cost us half a day. Judging itself was fair and well documented.'),
(15, 5, N'Huge thanks to the organizing team. The conflict-of-interest policy for judges gave everyone confidence that scoring was unbiased.'),
(16, 4, N'Enjoyed the team matching feature a lot - I joined solo and ended up with great teammates. Submission portal UX could be a bit smoother.'),
(17, 5, N'The live leaderboard after results were published was a nice touch. Seeing the per-criterion breakdown helped us understand exactly where we lost points.'),
(18, 4, N'A demanding but rewarding weekend. The mentor rotation meant we got perspectives from both industry and academia. Would recommend to juniors.'),
(19, 5, N'Best hackathon of the semester. The emphasis on working demos over slide decks rewarded teams that actually built something.'),
(20, 4, N'Registration and enrollment flow was seamless. The only friction was uploading large demo videos near the deadline when traffic spiked.'),
(21, 5, N'I appreciated how organizers handled the appeal process - our score review request was answered within a day with a detailed explanation.'),
(22, 3, N'Good learning experience overall, though I wish the judging session allowed more Q&A time per team. Five minutes felt rushed for a complex project.'),
(23, 5, N'The track system let us compete against teams solving similar problems, which made comparisons meaningful. Very thoughtful competition design.'),
(24, 4, N'Strong mentor lineup and a well-paced schedule. The mid-round progress evaluation was stressful but honestly kept us honest about our scope.'),
(25, 5, N'Organizers clearly iterated on past feedback. Compared to last season, communication was faster and the rubric was far more detailed.'),
(26, 4, N'Fun, intense, and fair. The certificate and award ceremony wrapped things up nicely. A recorded stream of the finals would be great for family.'),
(27, 5, N'The quality of competing teams pushed everyone up a level. Post-event networking with judges was an unexpected bonus.'),
(28, 4, N'Great platform experience - real-time submission status and version history saved us from a last-minute panic when we needed to roll back.'),
(29, 5, N'Clear rules, fair judging, and genuinely useful feedback on our weakest criterion. Exactly what a student competition should be.'),
(30, 3, N'The event was solid but onboarding for first-time participants could be better. A short orientation video would have answered most of my questions.'),
(31, 5, N'Loved the emphasis on agentic RAG - the theme felt current and relevant to what employers actually ask about in interviews.'),
(32, 4, N'Well-structured rounds and a reasonable workload. My only suggestion is to publish the demo-day running order earlier.'),
(33, 5, N'The organizers'' attention to detail showed everywhere, from the enrollment checklist to the per-team judge assignments. Flawless execution.'),
(34, 4, N'Really good mentor engagement during the build phase. Some judging criteria overlapped a bit, but the final scores still felt justified.'),
(35, 5, N'Our team came in with low expectations and left with an award and three job referrals. Cannot ask for more from a weekend.'),
(36, 4, N'Smooth event with responsive support. I liked the progress checkpoints - they forced us to demo early instead of integrating everything at 3am.'),
(37, 5, N'Transparent scoring, kind but rigorous judges, and a great closing ceremony. This event sets the bar for campus hackathons.'),
(38, 3, N'Content was strong but the venue room assignments were confusing on the first morning. Once settled, everything ran smoothly.'),
(39, 5, N'A truly student-centered competition. Feedback arrived while it was still fresh enough to act on, and the awards recognized more than just first place.');

DECLARE @poolSize INT = (SELECT COUNT(*) FROM @comments);

;WITH OrderedFeedback AS (
    SELECT
        pf.id,
        (ROW_NUMBER() OVER (ORDER BY pf.event_id, pf.id) - 1) % @poolSize AS comment_idx
    FROM dbo.participant_feedbacks pf
    INNER JOIN dbo.hackathon_events he ON he.id = pf.event_id
    WHERE he.status = 'COMPLETED'
)
UPDATE pf
SET pf.comment = c.comment,
    pf.overall_rating = c.rating,
    pf.updated_at = @now
FROM dbo.participant_feedbacks pf
INNER JOIN OrderedFeedback ofb ON ofb.id = pf.id
INNER JOIN @comments c ON c.idx = ofb.comment_idx;

PRINT CONCAT('Feedback rows updated: ', @@ROWCOUNT);

COMMIT TRANSACTION;

SELECT he.name,
       COUNT(*) AS fb_count,
       COUNT(DISTINCT pf.comment) AS distinct_comments,
       MIN(pf.overall_rating) AS min_rating,
       MAX(pf.overall_rating) AS max_rating
FROM dbo.participant_feedbacks pf
INNER JOIN dbo.hackathon_events he ON he.id = pf.event_id
WHERE he.status = 'COMPLETED'
GROUP BY he.name
ORDER BY he.name;
