package com.sealhackathon.event.controller;

import com.sealhackathon.common.storage.FileStorageService;
import io.swagger.v3.oas.annotations.Operation;
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
import java.util.Locale;

@RestController
@RequestMapping("/api/public/files")
@RequiredArgsConstructor
@Tag(name = "Public Files", description = "Public download of event and user avatar images")
public class PublicFileController {

    private final FileStorageService fileStorageService;

    @GetMapping({"/events/**", "/users/**"})
    @Operation(summary = "Download an avatar image by stored path")
    public ResponseEntity<Resource> downloadPublicFile(
            jakarta.servlet.http.HttpServletRequest request) throws Exception {
        String marker = "/api/public/files/";
        String fullPath = request.getRequestURI();
        int idx = fullPath.indexOf(marker);
        if (idx < 0) {
            return ResponseEntity.notFound().build();
        }
        String relativePath = fullPath.substring(idx + marker.length());

        Path filePath = fileStorageService.resolve(relativePath);
        Resource resource = new UrlResource(filePath.toUri());

        String filename = filePath.getFileName().toString().toLowerCase(Locale.ROOT);
        MediaType mediaType = MediaType.APPLICATION_OCTET_STREAM;
        if (filename.endsWith(".png")) {
            mediaType = MediaType.IMAGE_PNG;
        } else if (filename.endsWith(".webp")) {
            mediaType = MediaType.parseMediaType("image/webp");
        } else if (filename.endsWith(".jpg") || filename.endsWith(".jpeg")) {
            mediaType = MediaType.IMAGE_JPEG;
        }

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filePath.getFileName() + "\"")
                .contentType(mediaType)
                .body(resource);
    }
}
