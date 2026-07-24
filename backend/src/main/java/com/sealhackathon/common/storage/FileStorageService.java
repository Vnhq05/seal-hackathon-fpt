package com.sealhackathon.common.storage;

import com.sealhackathon.common.exception.BusinessException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
@Slf4j
public class FileStorageService {

    private static final long MAX_EVENT_AVATAR_BYTES = 2 * 1024 * 1024;
    private static final Set<String> ALLOWED_AVATAR_CONTENT_TYPES = Set.of(
            "image/jpeg", "image/png", "image/webp");

    private final Path uploadRoot;

    public FileStorageService(@Value("${app.storage.upload-dir}") String uploadDir) {
        this.uploadRoot = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.uploadRoot);
        } catch (IOException e) {
            throw new IllegalStateException("Could not create upload directory: " + this.uploadRoot, e);
        }
    }

    /**
     * Persists a submission file (any type) and returns a public API path for download.
     */
    public String storeSubmissionFile(MultipartFile file, UUID submissionId, int version) {
        String safeName = sanitizeFilename(file.getOriginalFilename());
        String relativePath = String.format("submissions/%s/v%d/%s", submissionId, version, safeName);
        Path target = uploadRoot.resolve(relativePath).normalize();

        if (!target.startsWith(uploadRoot)) {
            throw new BusinessException("Invalid file path", HttpStatus.BAD_REQUEST) {};
        }

        try {
            Files.createDirectories(target.getParent());
            file.transferTo(target);
            log.debug("Stored submission file at {}", target);
        } catch (IOException e) {
            throw new BusinessException("Failed to store submission file", HttpStatus.INTERNAL_SERVER_ERROR) {};
        }

        return "/api/files/" + relativePath.replace("\\", "/");
    }

    /**
     * @deprecated Prefer {@link #storeSubmissionFile}; kept for callers that still use the PDF name.
     */
    public String storeSubmissionPdf(MultipartFile file, UUID submissionId, int version) {
        return storeSubmissionFile(file, submissionId, version);
    }

    /**
     * Stores an event avatar image and returns a public API path
     * ({@code /api/public/files/events/{eventId}/...}).
     */
    public String storeEventAvatar(MultipartFile file, UUID eventId) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException("Avatar file is required", HttpStatus.BAD_REQUEST) {};
        }
        if (file.getSize() > MAX_EVENT_AVATAR_BYTES) {
            throw new BusinessException("Avatar must be 2 MB or smaller", HttpStatus.BAD_REQUEST) {};
        }
        String contentType = file.getContentType() != null
                ? file.getContentType().toLowerCase(Locale.ROOT)
                : "";
        if (!ALLOWED_AVATAR_CONTENT_TYPES.contains(contentType)) {
            throw new BusinessException(
                    "Avatar must be a JPEG, PNG, or WebP image",
                    HttpStatus.BAD_REQUEST) {};
        }

        String extension = extensionForContentType(contentType);
        String safeName = "avatar" + extension;
        String relativePath = String.format("events/%s/%s", eventId, safeName);
        Path target = uploadRoot.resolve(relativePath).normalize();

        if (!target.startsWith(uploadRoot)) {
            throw new BusinessException("Invalid file path", HttpStatus.BAD_REQUEST) {};
        }

        try {
            Files.createDirectories(target.getParent());
            // Replace prior avatar files in the event folder
            if (Files.isDirectory(target.getParent())) {
                try (var stream = Files.list(target.getParent())) {
                    stream.filter(Files::isRegularFile).forEach(p -> {
                        try {
                            Files.deleteIfExists(p);
                        } catch (IOException ignored) {
                            // best-effort cleanup
                        }
                    });
                }
            }
            file.transferTo(target);
            log.debug("Stored event avatar at {}", target);
        } catch (IOException e) {
            throw new BusinessException("Failed to store avatar file", HttpStatus.INTERNAL_SERVER_ERROR) {};
        }

        return "/api/public/files/" + relativePath.replace("\\", "/");
    }

    /**
     * Stores a user profile avatar and returns a public API path
     * ({@code /api/public/files/users/{userId}/...}).
     */
    public String storeUserAvatar(MultipartFile file, UUID userId) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException("Avatar file is required", HttpStatus.BAD_REQUEST) {};
        }
        if (file.getSize() > MAX_EVENT_AVATAR_BYTES) {
            throw new BusinessException("Avatar must be 2 MB or smaller", HttpStatus.BAD_REQUEST) {};
        }
        String contentType = file.getContentType() != null
                ? file.getContentType().toLowerCase(Locale.ROOT)
                : "";
        if (!ALLOWED_AVATAR_CONTENT_TYPES.contains(contentType)) {
            throw new BusinessException(
                    "Avatar must be a JPEG, PNG, or WebP image",
                    HttpStatus.BAD_REQUEST) {};
        }

        String extension = extensionForContentType(contentType);
        String safeName = "avatar" + extension;
        String relativePath = String.format("users/%s/%s", userId, safeName);
        Path target = uploadRoot.resolve(relativePath).normalize();

        if (!target.startsWith(uploadRoot)) {
            throw new BusinessException("Invalid file path", HttpStatus.BAD_REQUEST) {};
        }

        try {
            Files.createDirectories(target.getParent());
            if (Files.isDirectory(target.getParent())) {
                try (var stream = Files.list(target.getParent())) {
                    stream.filter(Files::isRegularFile).forEach(p -> {
                        try {
                            Files.deleteIfExists(p);
                        } catch (IOException ignored) {
                            // best-effort cleanup
                        }
                    });
                }
            }
            file.transferTo(target);
            log.debug("Stored user avatar at {}", target);
        } catch (IOException e) {
            throw new BusinessException("Failed to store avatar file", HttpStatus.INTERNAL_SERVER_ERROR) {};
        }

        return "/api/public/files/" + relativePath.replace("\\", "/");
    }

    public void deleteIfExists(String publicOrRelativePath) {
        if (publicOrRelativePath == null || publicOrRelativePath.isBlank()) {
            return;
        }
        String relative = stripPublicPrefix(publicOrRelativePath);
        Path target = uploadRoot.resolve(relative).normalize();
        if (!target.startsWith(uploadRoot)) {
            return;
        }
        try {
            Files.deleteIfExists(target);
        } catch (IOException e) {
            log.warn("Failed to delete file {}: {}", target, e.getMessage());
        }
    }

    public Path resolve(String relativePath) {
        String normalized = stripPublicPrefix(relativePath);
        Path resolved = uploadRoot.resolve(normalized).normalize();
        if (!resolved.startsWith(uploadRoot)) {
            throw new BusinessException("Invalid file path", HttpStatus.BAD_REQUEST) {};
        }
        if (!Files.exists(resolved) || !Files.isRegularFile(resolved)) {
            throw new BusinessException("File not found", HttpStatus.NOT_FOUND) {};
        }
        return resolved;
    }

    private String stripPublicPrefix(String path) {
        String p = path.replace("\\", "/");
        if (p.startsWith("/api/public/files/")) {
            return p.substring("/api/public/files/".length());
        }
        if (p.startsWith("/api/files/")) {
            return p.substring("/api/files/".length());
        }
        if (p.startsWith("api/public/files/")) {
            return p.substring("api/public/files/".length());
        }
        if (p.startsWith("api/files/")) {
            return p.substring("api/files/".length());
        }
        return p.startsWith("/") ? p.substring(1) : p;
    }

    private String extensionForContentType(String contentType) {
        return switch (contentType) {
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            default -> ".jpg";
        };
    }

    private String sanitizeFilename(String original) {
        if (original == null || original.isBlank()) {
            return "attachment.bin";
        }
        String name = Paths.get(original).getFileName().toString();
        return name.replaceAll("[^a-zA-Z0-9._-]", "_");
    }
}
