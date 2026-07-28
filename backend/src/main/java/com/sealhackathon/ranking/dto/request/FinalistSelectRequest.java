package com.sealhackathon.ranking.dto.request;

import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FinalistSelectRequest {

    /** Top N per group (if groups exist) or per track. Defaults to SEAL top-per-track / round cutoff. */
    @Min(1)
    private Integer topN;
}
