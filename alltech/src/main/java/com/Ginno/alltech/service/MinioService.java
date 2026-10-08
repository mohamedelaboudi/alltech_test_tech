package com.Ginno.alltech.service;

import io.minio.BucketExistsArgs;
import io.minio.GetObjectArgs;
import io.minio.GetPresignedObjectUrlArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.RemoveObjectArgs;
import io.minio.StatObjectArgs;
import io.minio.StatObjectResponse;
import io.minio.http.Method;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class MinioService {

    private final MinioClient minioClient;

    @Value("${minio.bucket-name}")
    private String bucketName;

    /**
     * Initialize the MinIO bucket when the application starts.
     */
    @PostConstruct
    public void initializeBucket() {
        try {
            boolean exists = minioClient.bucketExists(
                    BucketExistsArgs.builder()
                            .bucket(bucketName)
                            .build()
            );

            if (!exists) {
                minioClient.makeBucket(
                        MakeBucketArgs.builder()
                                .bucket(bucketName)
                                .build()
                );
            }

        } catch (Exception e) {
            throw new RuntimeException(
                    "Failed to initialize MinIO bucket: " + bucketName,
                    e
            );
        }
    }

    /**
     * Upload a file to MinIO.
     *
     * @param file   uploaded file
     * @param folder folder where the object will be stored
     * @return MinIO object key
     */
    public String upload(
            MultipartFile file,
            String folder
    ) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File cannot be empty");
        }

        try {
            String originalFilename = file.getOriginalFilename();

            String extension = "";

            if (originalFilename != null &&
                    originalFilename.contains(".")) {

                extension = originalFilename.substring(
                        originalFilename.lastIndexOf(".")
                ).toLowerCase();
            }

            String objectKey =
                    folder + "/" +
                            UUID.randomUUID() +
                            extension;

            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(bucketName)
                            .object(objectKey)
                            .stream(
                                    file.getInputStream(),
                                    file.getSize(),
                                    -1
                            )
                            .contentType(
                                    file.getContentType() != null
                                            ? file.getContentType()
                                            : "application/octet-stream"
                            )
                            .build()
            );

            return objectKey;

        } catch (Exception e) {
            throw new RuntimeException(
                    "Failed to upload file to MinIO",
                    e
            );
        }
    }

    /**
     * Delete an object from MinIO.
     */
    public void delete(String objectKey) {

        if (objectKey == null || objectKey.isBlank()) {
            return;
        }

        try {
            minioClient.removeObject(
                    RemoveObjectArgs.builder()
                            .bucket(bucketName)
                            .object(objectKey)
                            .build()
            );

        } catch (Exception e) {
            throw new RuntimeException(
                    "Failed to delete file from MinIO: " + objectKey,
                    e
            );
        }
    }

    /**
     * Generate a temporary URL to access an object.
     *
     * URL validity: 1 hour.
     */
    public String getPresignedUrl(String objectKey) {

        if (objectKey == null || objectKey.isBlank()) {
            return null;
        }

        try {
            return minioClient.getPresignedObjectUrl(
                    GetPresignedObjectUrlArgs.builder()
                            .method(Method.GET)
                            .bucket(bucketName)
                            .object(objectKey)
                            .expiry(
                                    1,
                                    TimeUnit.HOURS
                            )
                            .build()
            );

        } catch (Exception e) {
            throw new RuntimeException(
                    "Failed to generate file URL",
                    e
            );
        }
    }

    /**
     * Download object bytes from MinIO.
     */
    public byte[] getFileBytes(String objectKey) {
        if (objectKey == null || objectKey.isBlank()) {
            return null;
        }

        try (InputStream stream = minioClient.getObject(
                GetObjectArgs.builder()
                        .bucket(bucketName)
                        .object(objectKey)
                        .build()
        )) {
            return stream.readAllBytes();
        } catch (Exception e) {
            throw new RuntimeException(
                    "Failed to download file from MinIO: " + objectKey,
                    e
            );
        }
    }

    /**
     * Determine MIME content type of an object stored in MinIO.
     */
    public String getContentType(String objectKey) {
        if (objectKey == null || objectKey.isBlank()) {
            return "application/octet-stream";
        }

        String lower = objectKey.toLowerCase();
        if (lower.endsWith(".pdf")) return "application/pdf";
        if (lower.endsWith(".docx")) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        if (lower.endsWith(".doc")) return "application/msword";
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
        if (lower.endsWith(".png")) return "image/png";
        if (lower.endsWith(".gif")) return "image/gif";
        if (lower.endsWith(".webp")) return "image/webp";

        try {
            StatObjectResponse stat = minioClient.statObject(
                    StatObjectArgs.builder()
                            .bucket(bucketName)
                            .object(objectKey)
                            .build()
            );
            if (stat.contentType() != null && !stat.contentType().isBlank()) {
                return stat.contentType();
            }
        } catch (Exception ignored) {
        }

        return "application/octet-stream";
    }
}
