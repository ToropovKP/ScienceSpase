import {Pipe, PipeTransform} from '@angular/core';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';

@Pipe({name: 'linkify'})
export class LinkifyPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {
  }

  transform(text: string, isDarkBackground: boolean = false): SafeHtml {
    if (!text) return text;

    const urlRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
    const pseudoUrlRegex = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
    const emailRegex = /(\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,6})/g;

    const linkClass = isDarkBackground ? 'message-link-dark' : 'message-link';

    let linkedText = text
    .replace(urlRegex, url => `<a href="${url}" target="_blank" class="${linkClass}">${url}</a>`)
    .replace(pseudoUrlRegex, (match, p1, p2) => `${p1}<a href="http://${p2}" target="_blank" class="${linkClass}">${p2}</a>`)
    .replace(emailRegex, email => `<a href="mailto:${email}" class="${linkClass}">${email}</a>`);

    return this.sanitizer.bypassSecurityTrustHtml(linkedText);
  }
}