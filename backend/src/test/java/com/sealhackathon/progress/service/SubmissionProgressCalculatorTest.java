package com.sealhackathon.progress.service;

import com.sealhackathon.submission.domain.SubmissionAttachment;
import com.sealhackathon.submission.domain.SubmissionVersion;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class SubmissionProgressCalculatorTest {

    private final SubmissionProgressCalculator calculator = new SubmissionProgressCalculator();

    @Test
    void calculate_empty_isZero() {
        assertThat(calculator.calculate(List.of()).submissionProgressPercent()).isEqualTo(0.0);
        assertThat(calculator.calculate(List.of()).submittedParts()).isZero();
    }

    @Test
    void calculate_threeParts_percentages() {
        SubmissionVersion slideOnly = SubmissionVersion.builder()
                .slideUrl("https://slides.example/1")
                .build();
        assertThat(calculator.calculate(List.of(slideOnly)).submissionProgressPercent()).isEqualTo(33.33);

        SubmissionVersion two = SubmissionVersion.builder()
                .slideUrl("https://slides.example/1")
                .githubUrl("https://github.com/org/repo")
                .build();
        assertThat(calculator.calculate(List.of(two)).submissionProgressPercent()).isEqualTo(66.66);

        SubmissionVersion full = SubmissionVersion.builder()
                .slideUrl("https://slides.example/1")
                .githubUrl("https://github.com/org/repo")
                .otherUrl("https://example.com/notes")
                .build();
        assertThat(calculator.calculate(List.of(full)).submissionProgressPercent()).isEqualTo(100.0);
    }

    @Test
    void calculate_legacyDemoAndAttachmentCountAsOther() {
        SubmissionVersion withDemo = SubmissionVersion.builder()
                .demoUrl("https://youtube.com/watch?v=1")
                .build();
        assertThat(calculator.calculate(List.of(withDemo)).submittedParts()).isEqualTo(1);

        SubmissionVersion withFile = SubmissionVersion.builder()
                .attachments(List.of(SubmissionAttachment.builder()
                        .fileName("notes.zip")
                        .fileUrl("/api/files/x")
                        .fileSize(10L)
                        .build()))
                .build();
        assertThat(calculator.calculate(List.of(withFile)).submittedParts()).isEqualTo(1);
    }
}
