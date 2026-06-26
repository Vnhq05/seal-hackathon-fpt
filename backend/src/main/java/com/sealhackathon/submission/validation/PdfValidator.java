package com.sealhackathon.submission.validation;

import com.sealhackathon.common.exception.BusinessException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

@Component
public class PdfValidator {

    private static final long MAX_FILE_SIZE = 5_242_880L;
    private static final String PDF_CONTENT_TYPE = "application/pdf";

    public void validate(MultipartFile file, Integer pageCount) {
        validate(file, pageCount, true);
    }

    public void validate(MultipartFile file, Integer pageCount, boolean required) {
        if (file == null || file.isEmpty()) {
            if (required) {
                throw new BusinessException("PDF file is required", HttpStatus.BAD_REQUEST) {};
            }
            return;
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.equalsIgnoreCase(PDF_CONTENT_TYPE)) {
            throw new BusinessException("File must be a PDF document", HttpStatus.BAD_REQUEST) {};
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new BusinessException(
                    String.format("PDF file size must not exceed 5 MB. Uploaded: %.2f MB",
                            file.getSize() / 1_048_576.0),
                    HttpStatus.BAD_REQUEST) {};
        }

        if (pageCount != null && pageCount < 1) {
            throw new BusinessException("PDF page count must be at least 1", HttpStatus.BAD_REQUEST) {};
        }
    }
}
