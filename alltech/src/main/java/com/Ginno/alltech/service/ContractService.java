package com.Ginno.alltech.service;

import com.Ginno.alltech.entity.Employee;
import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
public class ContractService {

    public byte[] createContractPdf(Employee employee) {

        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        Document document = new Document();

        try {

            PdfWriter.getInstance(document, outputStream);

            document.open();

            Font titleFont = FontFactory.getFont(
                    FontFactory.HELVETICA_BOLD,
                    20
            );

            Font sectionFont = FontFactory.getFont(
                    FontFactory.HELVETICA_BOLD,
                    13
            );

            Font normalFont = FontFactory.getFont(
                    FontFactory.HELVETICA,
                    11
            );

            Font boldFont = FontFactory.getFont(
                    FontFactory.HELVETICA_BOLD,
                    11
            );

            // Title
            Paragraph title = new Paragraph(
                    "EMPLOYMENT CONTRACT",
                    titleFont
            );

            title.setAlignment(Paragraph.ALIGN_CENTER);
            title.setSpacingAfter(25);

            document.add(title);

            // Contract date
            Paragraph contractDate = new Paragraph(
                    "Contract date: " +
                            LocalDate.now().format(
                                    DateTimeFormatter.ofPattern("dd/MM/yyyy")
                            ),
                    normalFont
            );

            contractDate.setAlignment(Paragraph.ALIGN_RIGHT);
            contractDate.setSpacingAfter(20);

            document.add(contractDate);

            // Employee Information
            Paragraph employeeSection = new Paragraph(
                    "1. Employee Information",
                    sectionFont
            );

            employeeSection.setSpacingAfter(10);
            document.add(employeeSection);

            PdfPTable employeeTable = new PdfPTable(2);

            employeeTable.setWidthPercentage(100);
            employeeTable.setSpacingAfter(20);

            addRow(
                    employeeTable,
                    "Employee ID",
                    String.valueOf(employee.getId()),
                    boldFont,
                    normalFont
            );

            addRow(
                    employeeTable,
                    "Full Name",
                    employee.getFirstName() + " " +
                            employee.getLastName(),
                    boldFont,
                    normalFont
            );

            addRow(
                    employeeTable,
                    "Email",
                    employee.getEmail(),
                    boldFont,
                    normalFont
            );

            addRow(
                    employeeTable,
                    "Phone",
                    valueOrNotProvided(employee.getPhone()),
                    boldFont,
                    normalFont
            );

            document.add(employeeTable);

            // Position
            Paragraph positionSection = new Paragraph(
                    "2. Position",
                    sectionFont
            );

            positionSection.setSpacingAfter(10);
            document.add(positionSection);

            PdfPTable positionTable = new PdfPTable(2);

            positionTable.setWidthPercentage(100);
            positionTable.setSpacingAfter(20);

            addRow(
                    positionTable,
                    "Job Title",
                    employee.getJobTitle(),
                    boldFont,
                    normalFont
            );

            addRow(
                    positionTable,
                    "Department",
                    valueOrNotProvided(employee.getDepartment()),
                    boldFont,
                    normalFont
            );

            document.add(positionTable);

            // Employment Information
            Paragraph employmentSection = new Paragraph(
                    "3. Employment Information",
                    sectionFont
            );

            employmentSection.setSpacingAfter(10);
            document.add(employmentSection);

            PdfPTable employmentTable = new PdfPTable(2);

            employmentTable.setWidthPercentage(100);
            employmentTable.setSpacingAfter(20);

            addRow(
                    employmentTable,
                    "Hire Date",
                    formatDate(employee.getHireDate()),
                    boldFont,
                    normalFont
            );

            addRow(
                    employmentTable,
                    "Salary",
                    formatSalary(employee.getSalary()),
                    boldFont,
                    normalFont
            );

            document.add(employmentTable);

            // Contract Statement
            Paragraph termsSection = new Paragraph(
                    "4. Employment Statement",
                    sectionFont
            );

            termsSection.setSpacingAfter(10);
            document.add(termsSection);

            String fullName =
                    employee.getFirstName() + " " +
                            employee.getLastName();

            String statement =
                    "This document confirms that " +
                            fullName +
                            " is employed by the company in the position of " +
                            employee.getJobTitle() +
                            (employee.getDepartment() != null
                                    ? " within the " +
                                    employee.getDepartment() +
                                    " department."
                                    : ".");

            Paragraph statementParagraph =
                    new Paragraph(statement, normalFont);

            statementParagraph.setSpacingAfter(15);
            document.add(statementParagraph);

            // Signature Section
            Paragraph signatureSection = new Paragraph(
                    "5. Signatures",
                    sectionFont
            );

            signatureSection.setSpacingAfter(20);
            document.add(signatureSection);

            PdfPTable signatureTable = new PdfPTable(2);

            signatureTable.setWidthPercentage(100);

            PdfPCell companyCell = new PdfPCell(
                    new Phrase(
                            "For the Company\n\n\n" +
                                    "Signature: ____________________\n\n" +
                                    "Date: _________________________",
                            normalFont
                    )
            );

            PdfPCell employeeCell = new PdfPCell(
                    new Phrase(
                            "Employee\n\n" +
                                    fullName +
                                    "\n\nSignature: ____________________\n\n" +
                                    "Date: _________________________",
                            normalFont
                    )
            );

            companyCell.setBorder(PdfPCell.NO_BORDER);
            employeeCell.setBorder(PdfPCell.NO_BORDER);

            signatureTable.addCell(companyCell);
            signatureTable.addCell(employeeCell);

            document.add(signatureTable);

            document.close();

            return outputStream.toByteArray();

        } catch (DocumentException e) {

            throw new IllegalStateException(
                    "Failed to generate employee contract",
                    e
            );
        }
    }

    private void addRow(
            PdfPTable table,
            String label,
            String value,
            Font labelFont,
            Font valueFont
    ) {
        PdfPCell labelCell =
                new PdfPCell(new Phrase(label, labelFont));

        PdfPCell valueCell =
                new PdfPCell(new Phrase(value, valueFont));

        table.addCell(labelCell);
        table.addCell(valueCell);
    }

    private String valueOrNotProvided(String value) {
        return value != null && !value.isBlank()
                ? value
                : "Not provided";
    }

    private String formatDate(LocalDate date) {
        return date != null
                ? date.format(
                DateTimeFormatter.ofPattern("dd/MM/yyyy")
        )
                : "Not provided";
    }

    private String formatSalary(BigDecimal salary) {
        return salary != null
                ? salary.toPlainString() + " MAD"
                : "Not provided";
    }
}