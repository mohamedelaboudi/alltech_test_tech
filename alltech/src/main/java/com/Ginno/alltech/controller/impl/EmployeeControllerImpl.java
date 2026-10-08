package com.Ginno.alltech.controller.impl;


import com.Ginno.alltech.controller.EmployeeController;
import com.Ginno.alltech.dto.employee.CreateEmployeeRequest;
import com.Ginno.alltech.dto.employee.EmployeeResponse;
import com.Ginno.alltech.dto.employee.EmployeeSearchRequest;
import com.Ginno.alltech.dto.employee.UpdateEmployeeRequest;
import com.Ginno.alltech.service.EmployeeService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class EmployeeControllerImpl implements EmployeeController {

    private final EmployeeService employeeService;

    @Override
    public ResponseEntity<EmployeeResponse> create(
            CreateEmployeeRequest request) {

        return ResponseEntity.ok(
                employeeService.create(request)
        );
    }

    @Override
    public ResponseEntity<EmployeeResponse> getById(Long id) {

        return ResponseEntity.ok(
                employeeService.getById(id)
        );
    }

    @Override
    public ResponseEntity<Page<EmployeeResponse>> getAll(
            EmployeeSearchRequest request,
            int page,
            int size) {

        return ResponseEntity.ok(
                employeeService.getAll(
                        request,
                        page,
                        size
                )
        );
    }


    @Override
    public ResponseEntity<EmployeeResponse> update(
            Long id,
            UpdateEmployeeRequest request) {

        return ResponseEntity.ok(
                employeeService.update(id, request)
        );
    }

    @Override
    public ResponseEntity<Void> delete(Long id) {

        employeeService.delete(id);

        return ResponseEntity.noContent().build();
    }

    @Override
    public ResponseEntity<EmployeeResponse> uploadPhoto(
            Long id,
            MultipartFile file) {

        return ResponseEntity.ok(
                employeeService.uploadPhoto(id, file)
        );
    }

    @Override
    public ResponseEntity<EmployeeResponse> uploadCv(
            Long id,
            MultipartFile file) {

        return ResponseEntity.ok(
                employeeService.uploadCv(id, file)
        );
    }

    @Override
    public ResponseEntity<Void> deletePhoto(Long id) {

        employeeService.deletePhoto(id);

        return ResponseEntity.noContent().build();
    }

    @Override
    public ResponseEntity<Void> deleteCv(Long id) {

        employeeService.deleteCv(id);

        return ResponseEntity.noContent().build();
    }

    @Override
    public ResponseEntity<byte[]> generateContract(Long id) {

        byte[] pdf = employeeService.generateContract(id);

        return ResponseEntity.ok()
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=employee-contract-" + id + ".pdf"
                )
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }
    @Override
    public ResponseEntity<byte[]> getPhoto(Long id) {

        byte[] photo = employeeService.getPhoto(id);
        String contentType = employeeService.getPhotoContentType(id);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline")
                .contentType(MediaType.parseMediaType(contentType))
                .body(photo);
    }

    @Override
    public ResponseEntity<byte[]> getCv(Long id) {

        byte[] cv = employeeService.getCv(id);
        String contentType = employeeService.getCvContentType(id);
        String filename = employeeService.getCvFilename(id);

        return ResponseEntity.ok()
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        "inline; filename=\"" + filename + "\""
                )
                .contentType(MediaType.parseMediaType(contentType))
                .body(cv);
    }
}
