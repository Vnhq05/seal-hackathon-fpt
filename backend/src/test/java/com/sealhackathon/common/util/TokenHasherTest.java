package com.sealhackathon.common.util;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class TokenHasherTest {

    @Test
    void hash_shouldReturnStableSha256Hex() {
        assertThat(TokenHasher.hash("abc")).isEqualTo(TokenHasher.hash("abc"));
        assertThat(TokenHasher.hash("abc")).hasSize(64);
        assertThat(TokenHasher.hash("abc")).isNotEqualTo(TokenHasher.hash("abd"));
    }

    @Test
    void hash_shouldRejectBlank() {
        assertThatThrownBy(() -> TokenHasher.hash(" "))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
