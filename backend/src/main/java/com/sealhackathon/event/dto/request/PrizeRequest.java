package com.sealhackathon.event.dto.request;

import com.sealhackathon.event.domain.enums.PrizeRank;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PrizeRequest {

    private UUID trackId;

    @NotNull(message = "Prize rank is required")
    private PrizeRank rank;

    @NotBlank(message = "Prize value is required")
    @Size(max = 500)
    private String value;

    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be at least 1")
    private Integer quantity;

    @Size(max = 100)
    private String label;

    private Integer trackIndex;
}
