package com.sealhackathon.submission.controller;

import com.sealhackathon.common.storage.FileStorageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.nio.file.Path;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Files", description = "Download uploaded submission files")
public class FileDownloadController {

    private final FileStorageService fileStorageService;

    @GetMapping("/submissions/**")
    @Operation(summary = "Download a submission PDF by stored path")
    public ResponseEntity<Resource> downloadSubmissionFile(
            jakarta.servlet.http.HttpServletRequest request) throws Exception {
        String prefix = request.getContextPath() + "/api/files/";
        String fullPath = request.getRequestURI();
        String relativePath = fullPath.substring(fullPath.indexOf("/api/files/") + "/api/files/".length());

        Path filePath = fileStorageService.resolve(relativePath);
        Resource resource = new UrlResource(filePath.toUri());

        String filename = filePath.getFileName().toString();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(resource);
    }
}
