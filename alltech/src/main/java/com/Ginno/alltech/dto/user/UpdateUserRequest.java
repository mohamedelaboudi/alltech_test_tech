package com.Ginno.alltech.dto.user;

import com.Ginno.alltech.enums.PermissionType;
import com.Ginno.alltech.enums.UserType;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.util.Set;

@Getter
@Setter
public class UpdateUserRequest {

    @Size(max = 50, message = "First name must not exceed 50 characters")
    private String firstName;

    @Size(max = 50, message = "Last name must not exceed 50 characters")
    private String lastName;

    @Email(message = "Invalid email format")
    private String email;

    @Pattern(regexp = "^$|^.{8,100}$", message = "Password must be between 8 and 100 characters")
    private String password;

    private UserType userType;

    private boolean enabled;

    private Set<PermissionType> permissions;
}
