import {Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {LatLngBounds} from 'leaflet';
import {Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BlockGroupsService {
  private SERVER_URL = 'http://localhost:8080';

  constructor(private http: HttpClient) {
  }

  getFeatureInfo(width: number, height: number, x: number, y: number, bbox: LatLngBounds): Observable<string> {
    const options = {
      params: new HttpParams()
        .set('SERVICE', 'WMS')
        .append('VERSION', '1.3.0')
        .append('REQUEST', 'GetFeatureInfo')
        .append('LAYERS', 'block_groups:block_groups')
        .append('QUERY_LAYERS', 'block_groups:block_groups')
        .append('INFO_FORMAT', 'application/json')
        .append('TILED', 'FALSE')
        .append('I', x.toString())
        .append('J', y.toString())
        .append('FEATURE_COUNT', '1')
        .append('HEIGHT', height.toString())
        .append('WIDTH', width.toString())
        .append('BBOX', bbox.getSouthWest().lng + ',' + bbox.getSouthWest().lat + ','
          + bbox.getNorthEast().lng + ',' + bbox.getNorthEast().lat),
      responseType: 'json'
    };
    // @ts-ignore
    return this.http.get(this.SERVER_URL + '/geoserver/block_groups/wms', options);
  }
}
