package ai.deepclone.documents.controller;

import ai.deepclone.documents.entity.UploadedDocument;
import ai.deepclone.documents.service.DocumentService;
import ai.deepclone.users.entity.User;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.UUID;

/**
 * Document upload and management REST API.
 */
@Tag(name = "Documents", description = "Upload and manage documents for RAG indexing")
@RestController
@RequestMapping("/v1/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService documentService;

    @Operation(summary = "Upload a document")
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<UploadedDocument> upload(
            @AuthenticationPrincipal User user,
            @RequestParam("file") MultipartFile file
    ) throws IOException {
        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body(documentService.upload(user, file));
    }

    @Operation(summary = "List documents")
    @GetMapping
    public ResponseEntity<Page<UploadedDocument>> list(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(documentService.listDocuments(user.getId(), page, size));
    }

    @Operation(summary = "Get document status")
    @GetMapping("/{id}")
    public ResponseEntity<UploadedDocument> get(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id
    ) {
        return ResponseEntity.ok(documentService.getDocument(id, user.getId()));
    }

    @Operation(summary = "Delete document and its vectors")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id
    ) {
        documentService.deleteDocument(id, user.getId());
        return ResponseEntity.noContent().build();
    }
}
