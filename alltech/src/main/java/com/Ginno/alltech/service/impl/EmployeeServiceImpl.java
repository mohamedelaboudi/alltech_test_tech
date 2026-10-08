package com.Ginno.alltech.service.impl;

import com.Ginno.alltech.dto.employee.CreateEmployeeRequest;
import com.Ginno.alltech.dto.employee.EmployeeResponse;
import com.Ginno.alltech.dto.employee.EmployeeSearchRequest;
import com.Ginno.alltech.dto.employee.UpdateEmployeeRequest;
import com.Ginno.alltech.entity.Employee;
import com.Ginno.alltech.exception.ResourceNotFoundException;
import com.Ginno.alltech.mapper.EmployeeMapper;
import com.Ginno.alltech.repository.EmployeeRepository;
import com.Ginno.alltech.service.EmployeeService;
import com.Ginno.alltech.service.MinioService;
import com.Ginno.alltech.specification.EmployeeSpecification;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import com.Ginno.alltech.service.ContractService;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class EmployeeServiceImpl implements EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final EmployeeMapper employeeMapper;
    private final MinioService minioService;
    private final ContractService contractService;

    @Value("${backend.url:}")
    private String backendUrl;

    @Override
    public EmployeeResponse create(CreateEmployeeRequest request) {

        Employee employee = employeeMapper.toEntity(request);

        LocalDateTime now = LocalDateTime.now();

        employee.setCreatedAt(now);
        employee.setUpdatedAt(now);

        Employee savedEmployee =
                employeeRepository.save(employee);

        return toResponse(savedEmployee);
    }

    @Override
    public EmployeeResponse getById(Long id) {

        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Employee not found with id: " + id
                        )
                );

        return toResponse(employee);
    }

    @Override
    public Page<EmployeeResponse> getAll(
            EmployeeSearchRequest request,
            int page,
            int size
    ) {

        Pageable pageable = PageRequest.of(
                page,
                size,
                Sort.by("createdAt").descending()
        );

        Specification<Employee> specification =
                EmployeeSpecification.filter(request);

        return employeeRepository
                .findAll(specification, pageable)
                .map(this::toResponse);
    }

    @Override
    public EmployeeResponse update(
            Long id,
            UpdateEmployeeRequest request
    ) {

        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Employee not found with id: " + id
                        )
                );

        employeeMapper.updateEntity(
                request,
                employee
        );

        employee.setUpdatedAt(
                LocalDateTime.now()
        );

        Employee updatedEmployee =
                employeeRepository.save(employee);

        return toResponse(updatedEmployee);
    }

    @Override
    public void delete(Long id) {

        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Employee not found with id: " + id
                        )
                );

        String photoObjectKey =
                employee.getPhotoObjectKey();

        String cvObjectKey =
                employee.getCvObjectKey();

        employeeRepository.delete(employee);

        if (photoObjectKey != null) {
            minioService.delete(photoObjectKey);
        }

        if (cvObjectKey != null) {
            minioService.delete(cvObjectKey);
        }
    }

    @Override
    @Transactional
    public EmployeeResponse uploadPhoto(
            Long id,
            MultipartFile file
    ) {

        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Employee not found with id: " + id
                        )
                );

        validateImage(file);

        String oldObjectKey =
                employee.getPhotoObjectKey();

        /*
         * Upload the new file FIRST.
         */
        String newObjectKey = minioService.upload(
                file,
                "employees/" + id + "/photos"
        );

        try {

            /*
             * Update PostgreSQL with the new object key.
             */
            employee.setPhotoObjectKey(newObjectKey);
            employee.setUpdatedAt(LocalDateTime.now());

            Employee updatedEmployee =
                    employeeRepository.save(employee);

            /*
             * Delete the old object only after
             * the database has been successfully updated.
             */
            if (oldObjectKey != null &&
                    !oldObjectKey.equals(newObjectKey)) {

                minioService.delete(oldObjectKey);
            }

            return toResponse(updatedEmployee);

        } catch (Exception e) {

            /*
             * Database update failed.
             * Remove the newly uploaded file so
             * we don't leave an orphan object in MinIO.
             */
            try {
                minioService.delete(newObjectKey);
            } catch (Exception cleanupException) {
                e.addSuppressed(cleanupException);
            }

            throw e;
        }
    }

    @Override
    @Transactional
    public EmployeeResponse uploadCv(
            Long id,
            MultipartFile file
    ) {

        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Employee not found with id: " + id
                        )
                );

        validateCv(file);

        String oldObjectKey =
                employee.getCvObjectKey();

        /*
         * Upload the new CV FIRST.
         */
        String newObjectKey = minioService.upload(
                file,
                "employees/" + id + "/cv"
        );

        try {

            /*
             * Save new object key in PostgreSQL.
             */
            employee.setCvObjectKey(newObjectKey);
            employee.setUpdatedAt(LocalDateTime.now());

            Employee updatedEmployee =
                    employeeRepository.save(employee);

            /*
             * Delete old CV after DB update.
             */
            if (oldObjectKey != null &&
                    !oldObjectKey.equals(newObjectKey)) {

                minioService.delete(oldObjectKey);
            }

            return toResponse(updatedEmployee);

        } catch (Exception e) {

            /*
             * Database update failed.
             * Remove newly uploaded CV.
             */
            try {
                minioService.delete(newObjectKey);
            } catch (Exception cleanupException) {
                e.addSuppressed(cleanupException);
            }

            throw e;
        }
    }

    @Override
    @Transactional
    public void deletePhoto(Long id) {

        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Employee not found with id: " + id
                        )
                );

        String objectKey =
                employee.getPhotoObjectKey();

        if (objectKey == null) {
            return;
        }

        /*
         * Delete from MinIO first.
         */
        minioService.delete(objectKey);

        /*
         * Then remove the reference from PostgreSQL.
         */
        employee.setPhotoObjectKey(null);
        employee.setUpdatedAt(LocalDateTime.now());

        employeeRepository.save(employee);
    }

    @Override
    @Transactional
    public void deleteCv(Long id) {

        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Employee not found with id: " + id
                        )
                );

        String objectKey =
                employee.getCvObjectKey();

        if (objectKey == null) {
            return;
        }

        /*
         * Delete from MinIO first.
         */
        minioService.delete(objectKey);

        /*
         * Then remove the reference from PostgreSQL.
         */
        employee.setCvObjectKey(null);
        employee.setUpdatedAt(LocalDateTime.now());

        employeeRepository.save(employee);
    }

    private void validateImage(MultipartFile file) {

        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException(
                    "Photo is required"
            );
        }

        String contentType = file.getContentType();

        if (contentType == null ||
                !contentType.startsWith("image/")) {

            throw new IllegalArgumentException(
                    "Only image files are allowed"
            );
        }
    }

    private void validateCv(MultipartFile file) {

        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException(
                    "CV is required"
            );
        }

        String contentType = file.getContentType();

        if (contentType == null ||
                (
                        !contentType.equals("application/pdf") &&
                                !contentType.equals("application/msword") &&
                                !contentType.equals(
                                        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                )
                )
        ) {

            throw new IllegalArgumentException(
                    "Only PDF, DOC or DOCX files are allowed"
            );
        }
    }

    private EmployeeResponse toResponse(Employee employee) {

        String base = (backendUrl != null && !backendUrl.isBlank()) ? backendUrl.replaceAll("/+$", "") : "";

        String photoUrl = employee.getPhotoObjectKey() != null
                ? base + "/api/v1/employees/" + employee.getId() + "/photo"
                : null;

        String cvUrl = employee.getCvObjectKey() != null
                ? base + "/api/v1/employees/" + employee.getId() + "/cv"
                : null;

        return employeeMapper.toResponse(
                employee,
                photoUrl,
                cvUrl
        );
    }

    @Override
    public byte[] getPhoto(Long id) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Employee not found with id: " + id
                        )
                );

        String photoObjectKey = employee.getPhotoObjectKey();
        if (photoObjectKey == null || photoObjectKey.isBlank()) {
            throw new ResourceNotFoundException("Photo not found for employee id: " + id);
        }

        return minioService.getFileBytes(photoObjectKey);
    }

    @Override
    public String getPhotoContentType(Long id) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Employee not found with id: " + id
                        )
                );

        return minioService.getContentType(employee.getPhotoObjectKey());
    }

    @Override
    public byte[] getCv(Long id) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Employee not found with id: " + id
                        )
                );

        String cvObjectKey = employee.getCvObjectKey();
        if (cvObjectKey == null || cvObjectKey.isBlank()) {
            throw new ResourceNotFoundException("CV not found for employee id: " + id);
        }

        return minioService.getFileBytes(cvObjectKey);
    }

    @Override
    public String getCvContentType(Long id) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Employee not found with id: " + id
                        )
                );

        return minioService.getContentType(employee.getCvObjectKey());
    }

    @Override
    public String getCvFilename(Long id) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Employee not found with id: " + id
                        )
                );

        String cvObjectKey = employee.getCvObjectKey();
        String ext = ".pdf";
        if (cvObjectKey != null && cvObjectKey.contains(".")) {
            ext = cvObjectKey.substring(cvObjectKey.lastIndexOf("."));
        }
        return "employee-cv-" + id + ext;
    }

    @Override
    public byte[] generateContract(Long id) {

        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Employee not found with id: " + id
                        )
                );

        return contractService.createContractPdf(employee);
    }


}
