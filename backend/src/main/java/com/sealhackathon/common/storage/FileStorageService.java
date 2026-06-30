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
import java.util.UUID;

@Service
@Slf4j
public class FileStorageService {

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
     * Persists a submission PDF and returns a public API path for download.
     */
    public String storeSubmissionPdf(MultipartFile file, UUID submissionId, int version) {
        String safeName = sanitizeFilename(file.getOriginalFilename());
        String relativePath = String.format("submissions/%s/v%d/%s", submissionId, version, safeName);
        Path target = uploadRoot.resolve(relativePath).normalize();

        if (!target.startsWith(uploadRoot)) {
            throw new BusinessException("Invalid file path", HttpStatus.BAD_REQUEST) {};
        }

        try {
            Files.createDirectories(target.getParent());
            file.transferTo(target);
            log.debug("Stored submission PDF at {}", target);
        } catch (IOException e) {
            throw new BusinessException("Failed to store PDF file", HttpStatus.INTERNAL_SERVER_ERROR) {};
        }

        return "/api/files/" + relativePath.replace("\\", "/");
    }

    public Path resolve(String relativePath) {
        Path resolved = uploadRoot.resolve(relativePath).normalize();
        if (!resolved.startsWith(uploadRoot)) {
            throw new BusinessException("Invalid file path", HttpStatus.BAD_REQUEST) {};
        }
        if (!Files.exists(resolved) || !Files.isRegularFile(resolved)) {
            throw new BusinessException("File not found", HttpStatus.NOT_FOUND) {};
        }
        return resolved;
    }

    private String sanitizeFilename(String original) {
        if (original == null || original.isBlank()) {
            return "submission.pdf";
        }
        String name = Paths.get(original).getFileName().toString();
        return name.replaceAll("[^a-zA-Z0-9._-]", "_");
    }
}
