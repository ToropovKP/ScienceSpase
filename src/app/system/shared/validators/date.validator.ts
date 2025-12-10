import {AbstractControl, ValidatorFn} from "@angular/forms";

interface DateValidationErrors {
  minDate?: { actual: number; required: number };
  maxDate?: { actual: number; required: number };
}

export function dateValidator(): ValidatorFn {
  return (control: AbstractControl): DateValidationErrors | null => {
    const value = new Date(control.value);
    const minYear = new Date().getFullYear();
    const maxYear = new Date().getFullYear() + 5;

    if (value.getFullYear() < minYear) {
      return {minDate: {actual: value.getFullYear(), required: minYear}};
    }

    if (value.getFullYear() > maxYear) {
      return {maxDate: {actual: value.getFullYear(), required: maxYear}};
    }

    return null;
  };
}
