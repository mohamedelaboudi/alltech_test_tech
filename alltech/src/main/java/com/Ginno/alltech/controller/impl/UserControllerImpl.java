package com.Ginno.alltech.controller.impl;

import com.Ginno.alltech.controller.UserController;
import com.Ginno.alltech.dto.user.CreateUserRequest;
import com.Ginno.alltech.dto.user.UpdateUserRequest;
import com.Ginno.alltech.dto.user.UserResponse;
import com.Ginno.alltech.enums.PermissionType;
import com.Ginno.alltech.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;
import com.Ginno.alltech.dto.user.UserSearchRequest;
import org.springframework.data.domain.Page;


@RestController
@RequiredArgsConstructor
public class UserControllerImpl implements UserController {

    private final UserService userService;

    @Override
    public ResponseEntity<UserResponse> create(
            CreateUserRequest request) {

        return ResponseEntity.ok(
                userService.create(request)
        );
    }

    @Override
    public ResponseEntity<UserResponse> getById(Long id) {

        return ResponseEntity.ok(
                userService.getById(id)
        );
    }

    @Override
    public ResponseEntity<Page<UserResponse>> getAll(
            UserSearchRequest request,
            int page,
            int size) {

        return ResponseEntity.ok(
                userService.getAll(request, page, size)
        );
    }

    @Override
    public ResponseEntity<UserResponse> update(
            Long id,
            UpdateUserRequest request) {

        return ResponseEntity.ok(
                userService.update(id, request)
        );
    }

    @Override
    public ResponseEntity<Void> delete(Long id) {

        userService.delete(id);

        return ResponseEntity.noContent().build();
    }


}