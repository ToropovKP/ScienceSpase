import {AfterViewInit, Component, OnInit, ViewChild} from '@angular/core';
import {User} from "../shared/model/user";
import {userRoleMap, userStatusMap} from "../../app.constants";
import {Router} from "@angular/router";
import {HttpService} from "../shared/services/http.service";
import {AlertService} from "../shared/services/alert.service";
import {CommonModule} from "@angular/common";
import {Table, TableModule} from "primeng/table";
import {ButtonModule} from "primeng/button";
import {SortEvent} from "primeng/api";

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css'],
  imports: [CommonModule, TableModule, ButtonModule]
})
export class UsersComponent implements OnInit, AfterViewInit {

  @ViewChild('dt') dt!: Table;

  protected readonly userStatusMap = userStatusMap;
  protected readonly userRoleMap = userRoleMap;

  users: User[] = [];
  initialValue: User[] = [];
  isSorted: boolean | null = null;

  email!: string;
  role!: string;

  constructor(private router: Router,
              private httpService: HttpService,
              private alertService: AlertService) {
  }


  checkLogin(): boolean {
    let email: string | null = sessionStorage.getItem("email");
    let role: string | null = sessionStorage.getItem("role");

    if (email !== null) {
      this.email = email;
      this.role = role ? role : '';
      return true;
    } else {
      this.email = '';
      this.role = '';
      return false;
    }
  }

  ngAfterViewInit() {
    this.loadAllData()
  }

  ngOnInit(): void {
    if (!this.checkLogin() || !this.isAdmin()) {
      this.router.navigate(['']);
    }
  }

  loadAllData() {
    this.httpService.getUsers().then((data) => {
      this.users = data
      this.initialValue = [...data];
    }).catch(error => {
      let title = "Возникла непредвиденная ошибка";
      let description = 'Ошибка на стороне сервера';
      this.alertService.constructErrorAlert(error, title, description);
    });
  }

  openProfile(userId: bigint) {
    this.toPage(`/profile/${userId}`)
  }

  isAdmin(): boolean {
    return this.role === 'ADMIN';
  }

  toPage(link: string) {
    this.router.navigate([link]);
  }

  customSort(event: SortEvent) {
    if (this.isSorted == null) {
      this.isSorted = true;
      this.sortTableData(event);
    } else if (this.isSorted) {
      this.isSorted = false;
      this.sortTableData(event);
    } else if (!this.isSorted) {
      this.isSorted = null;
      this.users = [...this.initialValue];
      this.dt.reset();
    }
  }

  sortTableData(event: SortEvent) {
    event.data?.sort((data1, data2) => {
      // @ts-ignore
      let value1 = data1[event.field];
      //@ts-ignore
      let value2 = data2[event.field];
      let result = null;
      if (value1 == null && value2 != null) result = -1;
      else if (value1 != null && value2 == null) result = 1;
      else if (value1 == null && value2 == null) result = 0;
      else if (typeof value1 === 'string' && typeof value2 === 'string') result = value1.localeCompare(value2);
      else result = value1 < value2 ? -1 : value1 > value2 ? 1 : 0;
      //@ts-ignore
      return event.order * result;
    });
  }
}
