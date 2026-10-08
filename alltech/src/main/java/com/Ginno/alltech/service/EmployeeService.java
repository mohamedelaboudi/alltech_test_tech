package com.Ginno.alltech.service;

import com.Ginno.alltech.dto.employee.CreateEmployeeRequest;
import com.Ginno.alltech.dto.employee.EmployeeResponse;
import com.Ginno.alltech.dto.employee.EmployeeSearchRequest;
import com.Ginno.alltech.dto.employee.UpdateEmployeeRequest;
import org.springframework.data.domain.Page;
import org.springframework.web.multipart.MultipartFile;

public interface EmployeeService {

    EmployeeResponse create(
            CreateEmployeeRequest request
    );

    EmployeeResponse getById(
            Long id
    );

    Page<EmployeeResponse> getAll(
            EmployeeSearchRequest request,
            int page,
            int size
    );

    EmployeeResponse update(
            Long id,
            UpdateEmployeeRequest request
    );

    EmployeeResponse uploadPhoto(
            Long id,
            MultipartFile file
    );

    EmployeeResponse uploadCv(
            Long id,
            MultipartFile file
    );

    void deletePhoto(
            Long id
    );

    void deleteCv(
            Long id
    );

    void delete(
            Long id
    );

    byte[] generateContract(Long id);

    byte[] getPhoto(Long id);

    String getPhotoContentType(Long id);

    byte[] getCv(Long id);

    String getCvContentType(Long id);

    String getCvFilename(Long id);
}
