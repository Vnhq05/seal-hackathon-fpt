package com.sealhackathon.common.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.util.regex.Pattern;

public class StudentIdValidator implements ConstraintValidator<ValidStudentId, String> {

    private static final Pattern STUDENT_ID_PATTERN = Pattern.compile("^SE[0-9]{6}$");

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (value == null) {
            return true;
        }
        return STUDENT_ID_PATTERN.matcher(value).matches();
    }
}
