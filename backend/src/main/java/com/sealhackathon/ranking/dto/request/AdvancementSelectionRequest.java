package com.sealhackathon.ranking.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdvancementSelectionRequest {

    public enum Mode {
        AUTO,
        MANUAL
    }

    @NotNull
    private Mode mode;

    /** Required for AUTO — top N per group (if groups exist) or per track. */
    @Min(1)
    private Integer topN;

    /** Required for MANUAL — teams chosen by coordinator. */
    private List<UUID> teamIds;
}
