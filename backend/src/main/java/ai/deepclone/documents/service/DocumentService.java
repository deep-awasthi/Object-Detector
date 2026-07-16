package ai.deepclone.documents.service;

import ai.deepclone.common.config.DeepCloneProperties;
import ai.deepclone.common.exception.BusinessException;
import ai.deepclone.common.exception.ResourceNotFoundException;
import ai.deepclone.documents.entity.DocumentChunk;
import ai.deepclone.documents.entity.UploadedDocument;
import ai.deepclone.documents.repository.DocumentRepository;
import ai.deepclone.users.entity.User;
import ai.deepclone.vector.VectorStoreService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.springframework.ai.document.Document;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.util.*;

/**
 * Document processing service — handles upload, parsing, chunking, and Qdrant indexing.
 *
 * <p>Supports PDF, DOCX, TXT, Markdown, JSON, CSV and training data formats.
 * Processing happens asynchronously to avoid blocking the upload response.</p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DocumentService {

    private static final int CHUNK_SIZE = 1000;       // characters per chunk
    private static final int CHUNK_OVERLAP = 200;     // overlap between chunks
    private static final Set<String> ALLOWED_MIME_TYPES = Set.of(
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "text/plain",
            "text/markdown",
            "application/json",
            "text/csv",
            "text/x-markdown"
    );

    private final DocumentRepository documentRepository;
    private final VectorStoreService vectorStoreService;
    private final DeepCloneProperties properties;

    /**
     * Stores the uploaded file and triggers async processing.
     */
    @Transactional
    public UploadedDocument upload(User user, MultipartFile file) throws IOException {
        // Basic validation
        if (file.isEmpty()) {
            throw new BusinessException("EMPTY_FILE", "Uploaded file is empty");
        }

        UploadedDocument.FileType fileType = detectFileType(file);
        String storagePath = saveFile(file, user.getId());

        UploadedDocument doc = UploadedDocument.builder()
                .user(user)
                .originalFilename(file.getOriginalFilename())
                .fileType(fileType)
                .storagePath(storagePath)
                .fileSizeBytes(file.getSize())
                .status(UploadedDocument.ProcessingStatus.PENDING)
                .build();
        doc = documentRepository.save(doc);

        // Process asynchronously
        processDocumentAsync(doc.getId());
        return doc;
    }

    @Transactional(readOnly = true)
    public Page<UploadedDocument> listDocuments(UUID userId, int page, int size) {
        return documentRepository.findByUserIdOrderByUploadedAtDesc(userId, PageRequest.of(page, size));
    }

    @Transactional(readOnly = true)
    public UploadedDocument getDocument(UUID documentId, UUID userId) {
        return documentRepository.findByIdAndUserId(documentId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Document", documentId));
    }

    @Transactional
    public void deleteDocument(UUID documentId, UUID userId) {
        UploadedDocument doc = getDocument(documentId, userId);

        // Remove all chunk vectors from Qdrant
        List<String> vectorIds = doc.getChunks().stream()
                .map(DocumentChunk::getVectorId)
                .filter(Objects::nonNull)
                .toList();
        if (!vectorIds.isEmpty()) {
            vectorStoreService.deleteBatch(vectorIds);
        }

        // Delete stored file
        try {
            Files.deleteIfExists(Paths.get(doc.getStoragePath()));
        } catch (IOException ex) {
            log.warn("Could not delete file at {}: {}", doc.getStoragePath(), ex.getMessage());
        }

        documentRepository.delete(doc);
        log.info("Deleted document {} for user {}", documentId, userId);
    }

    @Async("asyncTaskExecutor")
    @Transactional
    public void processDocumentAsync(UUID documentId) {
        UploadedDocument doc = documentRepository.findById(documentId).orElse(null);
        if (doc == null) return;

        doc.setStatus(UploadedDocument.ProcessingStatus.PROCESSING);
        documentRepository.save(doc);

        try {
            // Extract text
            String rawText = extractText(doc);

            // Clean and chunk
            List<String> chunks = chunkText(rawText, CHUNK_SIZE, CHUNK_OVERLAP);

            // Embed and store each chunk in Qdrant
            List<Document> vectorDocs = new ArrayList<>();
            List<DocumentChunk> chunkEntities = new ArrayList<>();

            for (int i = 0; i < chunks.size(); i++) {
                String chunkContent = chunks.get(i);
                UUID chunkId = UUID.randomUUID();

                Map<String, Object> metadata = new HashMap<>();
                metadata.put("userId", doc.getUser().getId().toString());
                metadata.put("documentId", doc.getId().toString());
                metadata.put("contentType", "document");
                metadata.put("filename", doc.getOriginalFilename());
                metadata.put("chunkIndex", i);

                vectorDocs.add(new Document(chunkId.toString(), chunkContent, metadata));

                DocumentChunk chunk = DocumentChunk.builder()
                        .document(doc)
                        .content(chunkContent)
                        .chunkIndex(i)
                        .vectorId(chunkId.toString())
                        .build();
                chunkEntities.add(chunk);
            }

            vectorStoreService.storeBatch(vectorDocs);

            doc.setChunkCount(chunks.size());
            doc.setStatus(UploadedDocument.ProcessingStatus.COMPLETED);
            doc.setProcessedAt(Instant.now());
            doc.getChunks().addAll(chunkEntities);
            documentRepository.save(doc);

            log.info("Processed document {} into {} chunks", documentId, chunks.size());

        } catch (Exception ex) {
            log.error("Document processing failed for {}: {}", documentId, ex.getMessage(), ex);
            doc.setStatus(UploadedDocument.ProcessingStatus.FAILED);
            doc.setErrorMessage(ex.getMessage());
            documentRepository.save(doc);
        }
    }

    /**
     * Extracts plain text from a document based on its type.
     */
    private String extractText(UploadedDocument doc) throws IOException {
        Path filePath = Paths.get(doc.getStoragePath());

        return switch (doc.getFileType()) {
            case PDF -> extractPdfText(filePath);
            case DOCX -> extractDocxText(filePath);
            case TXT, MARKDOWN, JSON, CSV, WHATSAPP, TELEGRAM, DISCORD, SLACK, SMS ->
                    Files.readString(filePath, StandardCharsets.UTF_8);
            default -> Files.readString(filePath, StandardCharsets.UTF_8);
        };
    }

    private String extractPdfText(Path filePath) throws IOException {
        try (PDDocument pdf = org.apache.pdfbox.Loader.loadPDF(filePath.toFile())) {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(pdf);
        }
    }

    private String extractDocxText(Path filePath) throws IOException {
        try (FileInputStream fis = new FileInputStream(filePath.toFile());
             XWPFDocument doc = new XWPFDocument(fis)) {
            StringBuilder sb = new StringBuilder();
            doc.getParagraphs().forEach(p -> sb.append(p.getText()).append("\n"));
            return sb.toString();
        }
    }

    /**
     * Splits text into overlapping chunks for better semantic coverage at boundaries.
     */
    List<String> chunkText(String text, int chunkSize, int overlap) {
        List<String> chunks = new ArrayList<>();
        if (text == null || text.isBlank()) return chunks;

        String cleaned = cleanText(text);
        int start = 0;
        while (start < cleaned.length()) {
            int end = Math.min(start + chunkSize, cleaned.length());
            // Try to break at a sentence boundary
            if (end < cleaned.length()) {
                int lastPeriod = cleaned.lastIndexOf('.', end);
                if (lastPeriod > start + chunkSize / 2) {
                    end = lastPeriod + 1;
                }
            }
            chunks.add(cleaned.substring(start, end).trim());
            if (end >= cleaned.length()) {
                break;
            }
            int nextStart = end - overlap;
            if (nextStart <= start) {
                nextStart = end; // Fallback to avoid infinite loop
            }
            start = nextStart;
        }
        return chunks;
    }

    private String cleanText(String text) {
        return text
                .replaceAll("\\r\\n", "\n")
                .replaceAll("\\r", "\n")
                .replaceAll("\n{3,}", "\n\n")  // Collapse excessive newlines
                .replaceAll("\\s+", " ")        // Normalize whitespace
                .trim();
    }

    private String saveFile(MultipartFile file, UUID userId) throws IOException {
        Path storageRoot = Paths.get(properties.getStorage().getBasePath(), userId.toString());
        Files.createDirectories(storageRoot);

        String filename = UUID.randomUUID() + "_" + file.getOriginalFilename();
        Path destination = storageRoot.resolve(filename);
        file.transferTo(destination);
        return destination.toAbsolutePath().toString();
    }

    private UploadedDocument.FileType detectFileType(MultipartFile file) {
        String name = file.getOriginalFilename() != null ? file.getOriginalFilename().toLowerCase() : "";
        String contentType = file.getContentType() != null ? file.getContentType().toLowerCase() : "";

        if (name.endsWith(".pdf") || contentType.contains("pdf")) return UploadedDocument.FileType.PDF;
        if (name.endsWith(".docx")) return UploadedDocument.FileType.DOCX;
        if (name.endsWith(".md") || name.endsWith(".markdown")) return UploadedDocument.FileType.MARKDOWN;
        if (name.endsWith(".json") || contentType.contains("json")) return UploadedDocument.FileType.JSON;
        if (name.endsWith(".csv") || contentType.contains("csv")) return UploadedDocument.FileType.CSV;
        if (name.endsWith(".txt") || contentType.contains("text/plain")) return UploadedDocument.FileType.TXT;
        return UploadedDocument.FileType.UNKNOWN;
    }

    public long countDocuments(UUID userId) {
        return documentRepository.countByUserId(userId);
    }
}
