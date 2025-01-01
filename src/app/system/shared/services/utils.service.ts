import {Injectable} from "@angular/core";

@Injectable({providedIn: 'root'})
export class UtilsService {

  //todo доделать этот утилитный класс

  role!: string;

  constructor() {
    let role: string | null = sessionStorage.getItem("role");
    this.role = role ? role : '';
  }

  isAdmin(): boolean {
    return this.role === 'ADMIN';
  }
}
