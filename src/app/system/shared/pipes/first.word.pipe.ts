import {Pipe, PipeTransform} from "@angular/core";

@Pipe({name: 'firstWord'})
export class FirstWordPipe implements PipeTransform {
  transform(value: string): string {
    if (!value) return '';
    return value?.split(/\s+/)[0] || '';
  }
}
