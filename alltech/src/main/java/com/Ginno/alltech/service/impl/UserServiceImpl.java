package com.Ginno.alltech.service.impl;

import com.Ginno.alltech.dto.user.CreateUserRequest;
import com.Ginno.alltech.dto.user.UpdateUserRequest;
import com.Ginno.alltech.dto.user.UserResponse;
import com.Ginno.alltech.dto.user.UserSearchRequest;
import com.Ginno.alltech.entity.Permission;
import com.Ginno.alltech.entity.User;
import com.Ginno.alltech.enums.ActivityAction;
import com.Ginno.alltech.exception.EmailAlreadyExistsException;
import com.Ginno.alltech.exception.PermissionNotFoundException;
import com.Ginno.alltech.exception.ResourceNotFoundException;
import com.Ginno.alltech.mapper.UserMapper;
import com.Ginno.alltech.repository.PermissionRepository;
import com.Ginno.alltech.repository.UserRepository;
import com.Ginno.alltech.service.ActivityEventPublisher;
import com.Ginno.alltech.service.UserService;
import com.Ginno.alltech.specification.UserSpecification;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final PermissionRepository permissionRepository;
    private final ActivityEventPublisher activityEventPublisher;

    @Override
    @Transactional
    public UserResponse create(CreateUserRequest request) {

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new EmailAlreadyExistsException(
                    "User already exists with email: " + request.getEmail()
            );
        }

        User user = userMapper.toEntity(request);

        LocalDateTime now = LocalDateTime.now();

        user.setPassword(
                passwordEncoder.encode(request.getPassword())
        );

        user.setCreatedAt(now);
        user.setUpdatedAt(now);
        user.setEnabled(true);

        if (request.getPermissions() != null) {

            Set<Permission> permissions = request.getPermissions()
                    .stream()
                    .map(permissionType ->
                            permissionRepository.findByName(permissionType)
                                    .orElseThrow(() ->
                                            new PermissionNotFoundException(
                                                    "Permission not found: "
                                                            + permissionType
                                            )
                                    )
                    )
                    .collect(Collectors.toSet());

            user.setPermissions(permissions);
        }

        User savedUser = userRepository.save(user);

        activityEventPublisher.publish(
                ActivityAction.CREATE,
                "User",
                savedUser.getId(),
                "User " + savedUser.getEmail() + " was created"
        );

        return userMapper.toResponse(savedUser);
    }

    @Override
    public UserResponse getById(Long id) {

        User user = userRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "User not found with id: " + id
                        )
                );

        return userMapper.toResponse(user);
    }

    @Override
    public Page<UserResponse> getAll(
            UserSearchRequest request,
            int page,
            int size) {

        Pageable pageable = PageRequest.of(
                page,
                size,
                Sort.by("createdAt").descending()
        );

        Specification<User> specification =
                UserSpecification.filter(request);

        return userRepository
                .findAll(specification, pageable)
                .map(userMapper::toResponse);
    }

    @Override
    @Transactional
    public UserResponse update(
            Long id,
            UpdateUserRequest request) {

        User user = userRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "User not found with id: " + id
                        )
                );

        if (request.getEmail() != null
                && !user.getEmail().equals(request.getEmail())
                && userRepository.existsByEmail(request.getEmail())) {

            throw new EmailAlreadyExistsException(
                    "User already exists with email: "
                            + request.getEmail()
            );
        }

        userMapper.updateEntity(request, user);

        if (request.getPassword() != null
                && !request.getPassword().trim().isEmpty()) {

            user.setPassword(
                    passwordEncoder.encode(
                            request.getPassword().trim()
                    )
            );
        }

        if (request.getPermissions() != null) {

            Set<Permission> permissions = request.getPermissions()
                    .stream()
                    .map(permissionType ->
                            permissionRepository.findByName(permissionType)
                                    .orElseThrow(() ->
                                            new PermissionNotFoundException(
                                                    "Permission not found: "
                                                            + permissionType
                                            )
                                    )
                    )
                    .collect(Collectors.toSet());

            if (user.getPermissions() == null) {
                user.setPermissions(
                        new HashSet<>(permissions)
                );
            } else {
                user.getPermissions().clear();
                user.getPermissions().addAll(permissions);
            }
        }

        user.setUpdatedAt(LocalDateTime.now());

        User updatedUser = userRepository.save(user);

        activityEventPublisher.publish(
                ActivityAction.UPDATE,
                "User",
                updatedUser.getId(),
                "User " + updatedUser.getEmail() + " was updated"
        );

        return userMapper.toResponse(updatedUser);
    }

    @Override
    @Transactional
    public void delete(Long id) {

        User user = userRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "User not found with id: " + id
                        )
                );

        Long userId = user.getId();
        String userEmail = user.getEmail();

        userRepository.delete(user);

        activityEventPublisher.publish(
                ActivityAction.DELETE,
                "User",
                userId,
                "User " + userEmail + " was deleted"
        );
    }
}