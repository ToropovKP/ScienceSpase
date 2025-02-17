import {AbstractControl, ValidatorFn} from "@angular/forms";

export function maxDateValidator(maxDate: Date): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    const value = new Date(control.value);
    return value > maxDate ? {maxDate: {required: maxDate.getFullYear()}} : null;
  };
}
