import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Pelis } from '../models/Pelis';
import { enviroment } from '../../../../enviroments';

@Injectable({
  providedIn: 'root',
})
export class PelisService {
  private readonly apiUrl = enviroment.host + '/pelis/';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Pelis[]> {
    return this.http.get<Pelis[]>(this.apiUrl);
  }

  getById(id: string): Observable<Pelis> {
    return this.http.get<Pelis>(`${this.apiUrl}${id}`);
  }

  create(peli: Pelis): Observable<Pelis> {
    return this.http.post<Pelis>(this.apiUrl, peli);
  }

  update(id: string, peli: Partial<Pelis>): Observable<Pelis> {
    return this.http.put<Pelis>(`${this.apiUrl}${id}`, peli);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}${id}`);
  }
}
