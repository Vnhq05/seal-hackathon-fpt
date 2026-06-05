-- Thêm 2 cột phục vụ tính năng Quên mật khẩu
ALTER TABLE users
    ADD reset_otp VARCHAR(6) NULL,
    reset_otp_expiry DATETIME2 NULL;