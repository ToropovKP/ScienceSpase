import {Pipe, PipeTransform} from "@angular/core";

@Pipe({name: 'shortName'})
export class ShortNamePipe implements PipeTransform {
  transform(value: string, maxLength: number): string {
    if (!value) return '';
    return value.length > maxLength
        ? value.slice(0, maxLength - 1) + '…'
        : value;
  }
}
