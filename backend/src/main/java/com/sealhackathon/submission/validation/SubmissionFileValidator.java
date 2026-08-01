package com.sealhackathon.submission.validation;

import com.sealhackathon.common.exception.BusinessException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

/**
 * Size-only validation for arbitrary submission "Other" files (any MIME type).
 */
@Component
public class SubmissionFileValidator {

    @Value("${app.submission.file.max-size-bytes:5242880}")
    private long maxFileSizeBytes;

    public void validateOptional(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return;
        }
        if (file.getSize() > maxFileSizeBytes) {
            long maxMb = maxFileSizeBytes / (1024 * 1024);
            throw new BusinessException(
                    String.format("File size must not exceed %d MB. Uploaded: %.2f MB",
                            maxMb, file.getSize() / 1_048_576.0),
                    HttpStatus.BAD_REQUEST) {};
        }
    }
}
