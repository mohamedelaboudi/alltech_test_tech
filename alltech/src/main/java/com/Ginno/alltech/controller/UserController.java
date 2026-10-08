package com.Ginno.alltech.controller;

import com.Ginno.alltech.dto.user.CreateUserRequest;
import com.Ginno.alltech.dto.user.UpdateUserRequest;
import com.Ginno.alltech.dto.user.UserResponse;
import com.Ginno.alltech.dto.user.UserSearchRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import com.Ginno.alltech.enums.PermissionType;

@Tag(
        name = "User",
        description = "User management APIs"
)
@RequestMapping("/api/v1/users")
public interface UserController {

    @Operation(
            summary = "Create a new user",
            description = "Create a new user with the provided information.",
            responses = {
                    @ApiResponse(responseCode = "201", description = "User created successfully"),
                    @ApiResponse(responseCode = "400", description = "Bad Request"),
                    @ApiResponse(responseCode = "500", description = "Internal Server Error")
            }
    )
    @PostMapping
    @PreAuthorize("hasAuthority('CREATE')")
    ResponseEntity<UserResponse> create(
            @Valid  @RequestBody CreateUserRequest request
    );


    @Operation(
            summary = "Get user by ID",
            description = "Retrieve a user using its unique identifier.",
            responses = {
                    @ApiResponse(responseCode = "200", description = "User retrieved successfully"),
                    @ApiResponse(responseCode = "404", description = "User not found"),
                    @ApiResponse(responseCode = "500", description = "Internal Server Error")
            }
    )
    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('READ')")
    ResponseEntity<UserResponse> getById(
            @PathVariable Long id
    );


    @Operation(
            summary = "Search and paginate users",
            description = "Retrieve users using optional filters and pagination."
    )
    @GetMapping
    @PreAuthorize("hasAuthority('READ')")
    ResponseEntity<Page<UserResponse>> getAll(
            @ModelAttribute UserSearchRequest request,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    );


    @Operation(
            summary = "Update a user",
            description = "Update an existing user using its unique identifier.",
            responses = {
                    @ApiResponse(responseCode = "200", description = "User updated successfully"),
                    @ApiResponse(responseCode = "400", description = "Bad Request"),
                    @ApiResponse(responseCode = "404", description = "User not found"),
                    @ApiResponse(responseCode = "500", description = "Internal Server Error")
            }
    )
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('UPDATE')")
    ResponseEntity<UserResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserRequest request
    );


    @Operation(
            summary = "Delete a user",
            description = "Delete an existing user using its unique identifier.",
            responses = {
                    @ApiResponse(responseCode = "204", description = "User deleted successfully"),
                    @ApiResponse(responseCode = "404", description = "User not found"),
                    @ApiResponse(responseCode = "500", description = "Internal Server Error")
            }
    )
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('DELETE')")
    ResponseEntity<Void> delete(
            @PathVariable Long id
    );




}

