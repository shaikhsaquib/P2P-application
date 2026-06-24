import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  private url(path: string): string {
    return `${this.base}/${path.replace(/^\/+/, '')}`;
  }

  get<T>(path: string, params?: Record<string, any>): Observable<T> {
    let p = new HttpParams();
    if (params) Object.keys(params).forEach(k => params[k] != null && (p = p.set(k, String(params[k]))));
    return this.http.get<T>(this.url(path), { params: p });
  }

  post<T>(path: string, body: any): Observable<T> {
    return this.http.post<T>(this.url(path), body);
  }

  put<T>(path: string, body: any): Observable<T> {
    return this.http.put<T>(this.url(path), body);
  }

  delete<T>(path: string): Observable<T> {
    return this.http.delete<T>(this.url(path));
  }
}
