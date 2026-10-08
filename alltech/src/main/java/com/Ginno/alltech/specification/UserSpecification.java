package com.Ginno.alltech.specification;

import com.Ginno.alltech.entity.User;
import com.Ginno.alltech.dto.user.UserSearchRequest;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

public class UserSpecification {

    private UserSpecification() {
    }

    public static Specification<User> filter(UserSearchRequest request) {

        return (root, query, criteriaBuilder) -> {

            List<Predicate> predicates = new ArrayList<>();

            if (request.getFirstName() != null &&
                    !request.getFirstName().isBlank()) {

                predicates.add(
                        criteriaBuilder.like(
                                criteriaBuilder.lower(root.get("firstName")),
                                "%" + request.getFirstName().toLowerCase() + "%"
                        )
                );
            }

            if (request.getLastName() != null &&
                    !request.getLastName().isBlank()) {

                predicates.add(
                        criteriaBuilder.like(
                                criteriaBuilder.lower(root.get("lastName")),
                                "%" + request.getLastName().toLowerCase() + "%"
                        )
                );
            }

            if (request.getEmail() != null &&
                    !request.getEmail().isBlank()) {

                predicates.add(
                        criteriaBuilder.like(
                                criteriaBuilder.lower(root.get("email")),
                                "%" + request.getEmail().toLowerCase() + "%"
                        )
                );
            }

            if (request.getUserType() != null) {

                predicates.add(
                        criteriaBuilder.equal(
                                root.get("userType"),
                                request.getUserType()
                        )
                );
            }

            return criteriaBuilder.and(
                    predicates.toArray(new Predicate[0])
            );
        };
    }
}