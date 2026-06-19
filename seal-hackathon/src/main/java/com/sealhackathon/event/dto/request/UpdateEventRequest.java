package com.sealhackathon.event.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateEventRequest {

    @NotBlank(message = "Event name is required")
    @Size(max = 255)
    private String name;

    @NotBlank(message = "Season is required")
    @Size(max = 50)
    private String season;

    @NotNull(message = "Year is required")
    private Integer year;

    @NotNull(message = "Start date is required")
    private LocalDate startDate;

    @NotNull(message = "End date is required")
    private LocalDate endDate;

    @NotNull(message = "Registration deadline is required")
    private LocalDate registrationDeadline;
}
