package com.Ginno.alltech.mapper;

import com.Ginno.alltech.dto.user.CreateUserRequest;
import com.Ginno.alltech.dto.user.UpdateUserRequest;
import com.Ginno.alltech.dto.user.UserResponse;
import com.Ginno.alltech.entity.Permission;
import com.Ginno.alltech.entity.User;
import com.Ginno.alltech.enums.PermissionType;
import com.Ginno.alltech.enums.UserType;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import java.util.Arrays;
import java.util.Collections;
import java.util.Set;
import java.util.stream.Collectors;

@Mapper(componentModel = "spring")
public interface UserMapper {

    @Mapping(target = "permissions", ignore = true)
    User toEntity(CreateUserRequest request);

    @Mapping(target = "permissions", expression = "java(mapPermissions(user))")
    UserResponse toResponse(User user);

    @Mapping(target = "password", ignore = true)
    @Mapping(target = "permissions", ignore = true)
    void updateEntity(UpdateUserRequest request,
                      @MappingTarget User user);

    default Set<PermissionType> mapPermissions(User user) {
        if (user == null) {
            return Collections.emptySet();
        }
        if (user.getUserType() == UserType.SUPER_ADMIN) {
            return Arrays.stream(PermissionType.values()).collect(Collectors.toSet());
        }
        if (user.getPermissions() == null) {
            return Collections.emptySet();
        }
        return user.getPermissions().stream()
                .map(Permission::getName)
                .collect(Collectors.toSet());
    }
}
