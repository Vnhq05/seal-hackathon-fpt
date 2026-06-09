-- Hồ sơ cá nhân (profile) + chống brute-force đăng nhập.

-- Profile
IF COL_LENGTH('dbo.users', 'phone') IS NULL
BEGIN
ALTER TABLE dbo.users ADD phone NVARCHAR(20) NULL;
END;

IF COL_LENGTH('dbo.users', 'date_of_birth') IS NULL
BEGIN
ALTER TABLE dbo.users ADD date_of_birth DATE NULL;
END;

IF COL_LENGTH('dbo.users', 'gender') IS NULL
BEGIN
ALTER TABLE dbo.users ADD gender NVARCHAR(10) NULL;
END;

-- Khóa đăng nhập (5 lần sai → khóa 15 phút). Để NULL được (entity coi null = 0)
-- nhằm tránh lỗi khi tạo user mới không set sẵn cột này.
IF COL_LENGTH('dbo.users', 'failed_attempts') IS NULL
BEGIN
ALTER TABLE dbo.users ADD failed_attempts INT NULL;
END;

IF COL_LENGTH('dbo.users', 'lock_until') IS NULL
BEGIN
ALTER TABLE dbo.users ADD lock_until DATETIME2 NULL;
END;
