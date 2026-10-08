package com.Ginno.alltech.controller;

import com.Ginno.alltech.dto.employee.CreateEmployeeRequest;
import com.Ginno.alltech.dto.employee.EmployeeResponse;
import com.Ginno.alltech.dto.employee.EmployeeSearchRequest;
import com.Ginno.alltech.dto.employee.UpdateEmployeeRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@Tag(
        name = "Employee",
        description = "Employee management APIs"
)
@RequestMapping("/api/v1/employees")
public interface EmployeeController {

    @Operation(
            summary = "Create a new employee",
            description = "Create a new employee with the provided information.",
            responses = {
                    @ApiResponse(
                            responseCode = "201",
                            description = "Employee created successfully"
                    ),
                    @ApiResponse(
                            responseCode = "400",
                            description = "Bad Request"
                    ),
                    @ApiResponse(
                            responseCode = "500",
                            description = "Internal Server Error"
                    )
            }
    )
    @PostMapping
    @PreAuthorize("hasAuthority('CREATE')")
    ResponseEntity<EmployeeResponse> create(
            @Valid @RequestBody CreateEmployeeRequest request
    );

    @Operation(
            summary = "Get employee by ID",
            description = "Retrieve an employee using its unique identifier.",
            responses = {
                    @ApiResponse(
                            responseCode = "200",
                            description = "Employee retrieved successfully"
                    ),
                    @ApiResponse(
                            responseCode = "404",
                            description = "Employee not found"
                    ),
                    @ApiResponse(
                            responseCode = "500",
                            description = "Internal Server Error"
                    )
            }
    )
    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('READ')")
    ResponseEntity<EmployeeResponse> getById(
            @PathVariable Long id
    );

    @Operation(
            summary = "Search and paginate employees",
            description = "Retrieve employees using optional filters and pagination."
    )
    @GetMapping
    @PreAuthorize("hasAuthority('READ')")
    ResponseEntity<Page<EmployeeResponse>> getAll(
            @ModelAttribute EmployeeSearchRequest request,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    );

    @Operation(
            summary = "Update an employee",
            description = "Update an existing employee using its unique identifier."
    )
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('UPDATE')")
    ResponseEntity<EmployeeResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateEmployeeRequest request
    );

    @Operation(
            summary = "Delete an employee",
            description = "Delete an existing employee and its MinIO files."
    )
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('DELETE')")
    ResponseEntity<Void> delete(
            @PathVariable Long id
    );

    @Operation(
            summary = "Upload employee photo",
            description = "Upload or replace an employee photo in MinIO."
    )
    @PostMapping(
            value = "/{id}/photo",
            consumes = "multipart/form-data"
    )
    @PreAuthorize("hasAuthority('UPDATE')")
    ResponseEntity<EmployeeResponse> uploadPhoto(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file
    );

    @Operation(
            summary = "Upload employee CV",
            description = "Upload or replace an employee CV in MinIO."
    )
    @PostMapping(
            value = "/{id}/cv",
            consumes = "multipart/form-data"
    )
    @PreAuthorize("hasAuthority('UPDATE')")
    ResponseEntity<EmployeeResponse> uploadCv(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file
    );

    @Operation(
            summary = "Delete employee photo",
            description = "Delete the employee photo from MinIO."
    )
    @DeleteMapping("/{id}/photo")
    @PreAuthorize("hasAuthority('UPDATE')")
    ResponseEntity<Void> deletePhoto(
            @PathVariable Long id
    );

    @Operation(
            summary = "Delete employee CV",
            description = "Delete the employee CV from MinIO."
    )
    @DeleteMapping("/{id}/cv")
    @PreAuthorize("hasAuthority('UPDATE')")
    ResponseEntity<Void> deleteCv(
            @PathVariable Long id
    );

    @Operation(
            summary = "Generate employee contract",
            description = "Generate an employment contract PDF for an employee."
    )
    @GetMapping("/{id}/contract")
    @PreAuthorize("hasAuthority('READ')")
    ResponseEntity<byte[]> generateContract(
            @PathVariable Long id
    );
    @Operation(
            summary = "Get employee photo",
            description = "Download or view employee profile photo."
    )
    @GetMapping("/{id}/photo")
    ResponseEntity<byte[]> getPhoto(
            @PathVariable Long id
    );

    @Operation(
            summary = "Get employee CV",
            description = "Download or view employee CV document."
    )
    @GetMapping("/{id}/cv")
    ResponseEntity<byte[]> getCv(
            @PathVariable Long id
    );
}
