import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Archivo } from '../models/Archivo';
import { enviroment } from '../../../../enviroments';

@Injectable({
  providedIn: 'root',
})
export class ArchivoService {
  private readonly apiUrl = enviroment.host + '/files/';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Archivo[]> {
    return this.http.get<Archivo[]>(this.apiUrl);
  }

  getById(id: number): Observable<Archivo> {
    return this.http.get<Archivo>(`${this.apiUrl}${id}`);
  }

  create(archivo: FormData): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'multipart/form-data' });
    return this.http.post<FormData>(this.apiUrl, archivo);
  }

  update(id: number, Archivo: Partial<Archivo>): Observable<Archivo> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.put<Archivo>(`${this.apiUrl}/${id}`, Archivo, {
      headers,
    });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}${id}`);
  }
}
