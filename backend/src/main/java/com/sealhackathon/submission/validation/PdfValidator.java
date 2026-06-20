package com.sealhackathon.submission.validation;

import com.sealhackathon.common.exception.BusinessException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

@Component
public class PdfValidator {

    private static final long MAX_FILE_SIZE = 5_242_880L;
    private static final int MAX_PAGE_COUNT = 2;
    private static final String PDF_CONTENT_TYPE = "application/pdf";

    public void validate(MultipartFile file, Integer pageCount) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException("PDF file is required", HttpStatus.BAD_REQUEST) {};
        }

        if (!PDF_CONTENT_TYPE.equals(file.getContentType())) {
            throw new BusinessException("File must be a PDF document", HttpStatus.BAD_REQUEST) {};
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new BusinessException(
                    String.format("PDF file size must not exceed 5 MB. Uploaded: %.2f MB",
                            file.getSize() / 1_048_576.0),
                    HttpStatus.BAD_REQUEST) {};
        }

        if (pageCount == null) {
            throw new BusinessException("PDF page count is required", HttpStatus.BAD_REQUEST) {};
        }

        if (pageCount < 1 || pageCount > MAX_PAGE_COUNT) {
            throw new BusinessException(
                    "PDF must have between 1 and " + MAX_PAGE_COUNT + " pages. Found: " + pageCount,
                    HttpStatus.BAD_REQUEST) {};
        }
    }
}
