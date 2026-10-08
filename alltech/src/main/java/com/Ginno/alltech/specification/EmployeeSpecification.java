package com.Ginno.alltech.specification;

import com.Ginno.alltech.dto.employee.EmployeeSearchRequest;
import com.Ginno.alltech.entity.Employee;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

public class EmployeeSpecification {

    private EmployeeSpecification() {
    }

    public static Specification<Employee> filter(
            EmployeeSearchRequest request) {

        return (root, query, criteriaBuilder) -> {

            List<Predicate> predicates = new ArrayList<>();

            if (request.getFirstName() != null &&
                    !request.getFirstName().isBlank()) {

                predicates.add(
                        criteriaBuilder.like(
                                criteriaBuilder.lower(
                                        root.get("firstName")
                                ),
                                "%" + request.getFirstName().toLowerCase() + "%"
                        )
                );
            }

            if (request.getLastName() != null &&
                    !request.getLastName().isBlank()) {

                predicates.add(
                        criteriaBuilder.like(
                                criteriaBuilder.lower(
                                        root.get("lastName")
                                ),
                                "%" + request.getLastName().toLowerCase() + "%"
                        )
                );
            }

            if (request.getEmail() != null &&
                    !request.getEmail().isBlank()) {

                predicates.add(
                        criteriaBuilder.like(
                                criteriaBuilder.lower(
                                        root.get("email")
                                ),
                                "%" + request.getEmail().toLowerCase() + "%"
                        )
                );
            }

            if (request.getPhone() != null &&
                    !request.getPhone().isBlank()) {

                predicates.add(
                        criteriaBuilder.like(
                                root.get("phone"),
                                "%" + request.getPhone() + "%"
                        )
                );
            }

            if (request.getJobTitle() != null &&
                    !request.getJobTitle().isBlank()) {

                predicates.add(
                        criteriaBuilder.like(
                                criteriaBuilder.lower(
                                        root.get("jobTitle")
                                ),
                                "%" + request.getJobTitle().toLowerCase() + "%"
                        )
                );
            }

            if (request.getDepartment() != null &&
                    !request.getDepartment().isBlank()) {

                predicates.add(
                        criteriaBuilder.like(
                                criteriaBuilder.lower(
                                        root.get("department")
                                ),
                                "%" + request.getDepartment().toLowerCase() + "%"
                        )
                );
            }

            if (request.getHireDate() != null) {

                predicates.add(
                        criteriaBuilder.equal(
                                root.get("hireDate"),
                                request.getHireDate()
                        )
                );
            }

            if (request.getSalary() != null) {

                predicates.add(
                        criteriaBuilder.equal(
                                root.get("salary"),
                                request.getSalary()
                        )
                );
            }

            return criteriaBuilder.and(
                    predicates.toArray(new Predicate[0])
            );
        };
    }
}