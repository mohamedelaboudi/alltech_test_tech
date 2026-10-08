package com.Ginno.alltech.security;

import com.Ginno.alltech.entity.User;
import com.Ginno.alltech.enums.PermissionType;
import com.Ginno.alltech.enums.UserType;
import com.Ginno.alltech.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String email)
            throws UsernameNotFoundException {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new UsernameNotFoundException(
                                "User not found with email: " + email
                        )
                );

        List<SimpleGrantedAuthority> authorities;

        if (user.getUserType() == UserType.SUPER_ADMIN) {

            authorities = new ArrayList<>();

            // SUPER_ADMIN role
            authorities.add(
                    new SimpleGrantedAuthority("ROLE_SUPER_ADMIN")
            );

            // SUPER_ADMIN has all permissions
            authorities.addAll(
                    Arrays.stream(PermissionType.values())
                            .map(permission ->
                                    new SimpleGrantedAuthority(permission.name())
                            )
                            .toList()
            );

        } else {

            authorities = user.getPermissions()
                    .stream()
                    .map(permission ->
                            new SimpleGrantedAuthority(
                                    permission.getName().name()
                            )
                    )
                    .toList();
        }

        return org.springframework.security.core.userdetails.User
                .withUsername(user.getEmail())
                .password(user.getPassword())
                .authorities(authorities)
                .disabled(!user.isEnabled())
                .build();
    }
}