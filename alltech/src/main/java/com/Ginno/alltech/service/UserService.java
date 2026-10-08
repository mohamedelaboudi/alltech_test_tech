package com.Ginno.alltech.service;

import com.Ginno.alltech.dto.user.UserSearchRequest;
import com.Ginno.alltech.enums.PermissionType;
import org.springframework.data.domain.Page;
import com.Ginno.alltech.dto.user.CreateUserRequest;
import com.Ginno.alltech.dto.user.UpdateUserRequest;
import com.Ginno.alltech.dto.user.UserResponse;


public interface UserService {

    UserResponse create(CreateUserRequest request);

    UserResponse getById(Long id);

    Page<UserResponse> getAll(
            UserSearchRequest request,
            int page,
            int size
    );

    UserResponse update(Long id, UpdateUserRequest request);

    void delete(Long id);



    }