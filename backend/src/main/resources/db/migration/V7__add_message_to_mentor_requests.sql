-- Thêm lời nhắn (note) + email người gửi cho lời mời mentor,
-- để Mentor thấy "From <email>" và nội dung tin nhắn khi nhận lời mời.

IF COL_LENGTH('dbo.mentor_requests', 'message') IS NULL
BEGIN
ALTER TABLE dbo.mentor_requests
    ADD message NVARCHAR(MAX) NULL;
END;

IF COL_LENGTH('dbo.mentor_requests', 'from_email') IS NULL
BEGIN
ALTER TABLE dbo.mentor_requests
    ADD from_email NVARCHAR(190) NULL;
END;
