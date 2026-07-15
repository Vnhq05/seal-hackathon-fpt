package com.sealhackathon.support;

import org.junit.jupiter.api.extension.ConditionEvaluationResult;
import org.junit.jupiter.api.extension.ExecutionCondition;
import org.junit.jupiter.api.extension.ExtensionContext;
import org.testcontainers.DockerClientFactory;

/**
 * Local without Docker: skip integration tests.
 * CI ({@code CI=true}) without Docker: keep enabled so container start fails the build
 * instead of a silent skip (badge-green lie).
 */
public class DockerAvailabilityCondition implements ExecutionCondition {

    @Override
    public ConditionEvaluationResult evaluateExecutionCondition(ExtensionContext context) {
        if (DockerClientFactory.instance().isDockerAvailable()) {
            return ConditionEvaluationResult.enabled("Docker is available");
        }
        if (isCi()) {
            return ConditionEvaluationResult.enabled(
                    "CI without Docker — integration tests must fail when the container cannot start");
        }
        return ConditionEvaluationResult.disabled(
                "Docker is not available; skipping integration tests locally");
    }

    static boolean isCi() {
        return "true".equalsIgnoreCase(System.getenv("CI"));
    }
}
