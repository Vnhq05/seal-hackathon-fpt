-- Danh sách nhân sự (roster) của từng cuộc thi: judge & mentor được phân vào cuộc thi.
-- Mỗi dòng = 1 judge/mentor thuộc 1 cuộc thi. Idempotent để chạy lại an toàn.

IF OBJECT_ID('dbo.competition_judges', 'U') IS NULL
BEGIN
    CREATE TABLE competition_judges (
        id             BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_competition_judges PRIMARY KEY,
        competition_id BIGINT NOT NULL,
        judge_id       BIGINT NOT NULL,
        created_at     DATETIME2 NULL,
        CONSTRAINT FK_cj_comp  FOREIGN KEY (competition_id) REFERENCES competitions(id) ON DELETE CASCADE,
        CONSTRAINT FK_cj_judge FOREIGN KEY (judge_id)       REFERENCES judges(id)       ON DELETE CASCADE,
        CONSTRAINT UQ_cj UNIQUE (competition_id, judge_id)
    );
END;

IF OBJECT_ID('dbo.competition_mentors', 'U') IS NULL
BEGIN
    CREATE TABLE competition_mentors (
        id             BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_competition_mentors PRIMARY KEY,
        competition_id BIGINT NOT NULL,
        mentor_id      BIGINT NOT NULL,
        created_at     DATETIME2 NULL,
        CONSTRAINT FK_cm_comp   FOREIGN KEY (competition_id) REFERENCES competitions(id) ON DELETE CASCADE,
        CONSTRAINT FK_cm_mentor FOREIGN KEY (mentor_id)      REFERENCES mentors(id)      ON DELETE CASCADE,
        CONSTRAINT UQ_cm UNIQUE (competition_id, mentor_id)
    );
END;
