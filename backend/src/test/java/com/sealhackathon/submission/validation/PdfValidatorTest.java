package com.sealhackathon.submission.validation;

import com.sealhackathon.common.exception.BusinessException;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import static org.assertj.core.api.Assertions.assertThatNoException;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class PdfValidatorTest {

    private final PdfValidator validator = new PdfValidator();

    @Test
    void shouldAcceptValidPdf() {
        MockMultipartFile file = new MockMultipartFile(
                "pdf", "report.pdf", "application/pdf", new byte[1024]);
        assertThatNoException().isThrownBy(() -> validator.validate(file, 2));
    }

    @Test
    void shouldRejectNull() {
        assertThatThrownBy(() -> validator.validate(null, 1))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("required");
    }

    @Test
    void shouldRejectEmptyFile() {
        MockMultipartFile file = new MockMultipartFile(
                "pdf", "empty.pdf", "application/pdf", new byte[0]);
        assertThatThrownBy(() -> validator.validate(file, 1))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("required");
    }

    @Test
    void shouldRejectNonPdfContentType() {
        MockMultipartFile file = new MockMultipartFile(
                "pdf", "doc.docx", "application/msword", new byte[100]);
        assertThatThrownBy(() -> validator.validate(file, 1))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("PDF");
    }

    @Test
    void shouldRejectFileLargerThan5MB() {
        byte[] bigContent = new byte[5_242_881];
        MockMultipartFile file = new MockMultipartFile(
                "pdf", "big.pdf", "application/pdf", bigContent);
        assertThatThrownBy(() -> validator.validate(file, 1))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("5 MB");
    }

    @Test
    void shouldAcceptAnyPositivePageCount() {
        MockMultipartFile file = new MockMultipartFile(
                "pdf", "long.pdf", "application/pdf", new byte[100]);
        assertThatNoException().isThrownBy(() -> validator.validate(file, 10));
    }

    @Test
    void shouldAllowMissingPdfWhenNotRequired() {
        assertThatNoException().isThrownBy(() -> validator.validate(null, null, false));
    }

    @Test
    void shouldRejectZeroPages() {
        MockMultipartFile file = new MockMultipartFile(
                "pdf", "zero.pdf", "application/pdf", new byte[100]);
        assertThatThrownBy(() -> validator.validate(file, 0))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    void shouldAcceptExactly5MB() {
        byte[] content = new byte[5_242_880];
        MockMultipartFile file = new MockMultipartFile(
                "pdf", "exact.pdf", "application/pdf", content);
        assertThatNoException().isThrownBy(() -> validator.validate(file, 2));
    }
}
