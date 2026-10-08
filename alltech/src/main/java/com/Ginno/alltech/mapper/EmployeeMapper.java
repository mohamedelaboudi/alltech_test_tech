package com.Ginno.alltech.mapper;

import com.Ginno.alltech.dto.employee.CreateEmployeeRequest;
import com.Ginno.alltech.dto.employee.EmployeeResponse;
import com.Ginno.alltech.dto.employee.UpdateEmployeeRequest;
import com.Ginno.alltech.entity.Employee;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface EmployeeMapper {


    @Mapping(target = "id", ignore = true)
    @Mapping(target = "photoObjectKey", ignore = true)
    @Mapping(target = "cvObjectKey", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Employee toEntity(CreateEmployeeRequest request);

    @Mapping(target = "photoUrl", source = "photoUrl")
    @Mapping(target = "cvUrl", source = "cvUrl")
    EmployeeResponse toResponse(
            Employee employee,
            String photoUrl,
            String cvUrl
    );

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "photoObjectKey", ignore = true)
    @Mapping(target = "cvObjectKey", ignore = true)
    void updateEntity(UpdateEmployeeRequest request,
                      @MappingTarget Employee employee);
}