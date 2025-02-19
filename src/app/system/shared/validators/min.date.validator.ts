import {AbstractControl, ValidatorFn} from "@angular/forms";

export function minDateValidator(minDate: Date): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    const value = new Date(control.value);
    return value < minDate ? {minDate: {required: minDate.getFullYear()}} : null;
  };
}
