package com.Ginno.alltech.dto.user;

import com.Ginno.alltech.enums.UserType;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserSearchRequest {

    @Size(max = 50, message = "First name must not exceed 50 characters")
    private String firstName;

    @Size(max = 50, message = "Last name must not exceed 50 characters")
    private String lastName;

    @Size(max = 100, message = "Email must not exceed 100 characters")
    private String email;

    private UserType userType;
}