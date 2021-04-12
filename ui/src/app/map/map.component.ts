import {Component, AfterViewInit} from '@angular/core';
import * as L from 'leaflet';
import {BlockGroupsService} from '../blockGroups.service';
import {LeafletEvent} from 'leaflet';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent implements AfterViewInit {
  // @ts-ignore
  private map: L.Map;
  private currentLayer: string;

  private initMap(): void {

    const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      minZoom: 6,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    });

    this.map = L.map('map', {
      center: [34.0, -118.22],
      zoom: 10,
      layers: [osm]
    });
  }

  constructor(
    private blockGroupsService: BlockGroupsService
  ) {
    this.currentLayer = 'None';
  }

  private getPopup(returnedFeature: any): string {
    if (this.currentLayer === 'Has Local ISP') {
      return '<b>GEOID: </b>' + returnedFeature.properties.GEOID + '<br />'
        + '<b>Has local ISP: </b>' + String(Boolean(returnedFeature.properties.has_local)).replace(/^\w/, c => c.toUpperCase());
    } else if (this.currentLayer === 'OOKLA Download') {
      return '<b>GEOID: </b>' + returnedFeature.properties.GEOID + '<br />'
        + '<b>Average Download Speed (OOKLA): </b>' + (returnedFeature.properties.avg_d_kbps / 1000.0).toPrecision(3);
    } else if (this.currentLayer === 'Max Download') {
      return '<b>GEOID: </b>' + returnedFeature.properties.GEOID + '<br />'
        + '<b>Average Max Download Speed: </b>' + (returnedFeature.properties.avg_max_dn).toPrecision(5);
    }
    return '';
  }

  // tslint:disable-next-line:typedef
  private initBlockGroupsLayers() {
    const hasLocalLayer = L.tileLayer.wms(BlockGroupsService.SERVER_URL + '/geoserver/block_groups/wms', {
      layers: 'block_groups',
      format: 'image/png',
      maxZoom: 18,
      minZoom: 6,
      styles: 'has_local',
      transparent: true
    });

    const hasLocalLegend = L.control.zoom({position: 'bottomright'});
    hasLocalLegend.onAdd = () => {
      const div = L.DomUtil.create('div', 'info legend');
      div.innerHTML +=
        '<div style="text-align: center; background-color: white">' +
        '<b> Legend </b></br>' +
        '<img src="' + BlockGroupsService.SERVER_URL + '/geoserver/wms?STYLE=has_local&REQUEST=GetLegendGraphic&VERSION=1.3.0&FORMAT=image/png&LAYER=block_groups:block_groups&fontAntiAliasing:true" alt="legend">' +
        '</div>';
      return div;
    };

    const ooklaDownloadLayer = L.tileLayer.wms(BlockGroupsService.SERVER_URL + '/geoserver/block_groups/wms', {
      layers: 'block_groups',
      format: 'image/png',
      maxZoom: 18,
      minZoom: 6,
      styles: 'ookla_download',
      transparent: true
    });

    const ooklaDownloadLegend = L.control.zoom({position: 'bottomright'});
    ooklaDownloadLegend.onAdd = () => {
      const div = L.DomUtil.create('div', 'info legend');
      div.innerHTML +=
        '<div style="text-align: center; background-color: white">' +
        '<b> Legend </b></br>' +
        '<img src="' + BlockGroupsService.SERVER_URL + '/geoserver/wms?STYLE=ookla_download&REQUEST=GetLegendGraphic&VERSION=1.3.0&FORMAT=image/png&LAYER=block_groups:block_groups&fontAntiAliasing:true" alt="legend">' +
        '</div>';
      return div;
    };

    const maxDownloadLayer = L.tileLayer.wms(BlockGroupsService.SERVER_URL + '/geoserver/block_groups/wms', {
      layers: 'block_groups',
      format: 'image/png',
      maxZoom: 18,
      minZoom: 6,
      styles: 'max_download',
      transparent: true
    });

    const maxDownloadLegend = L.control.zoom({position: 'bottomright'});
    maxDownloadLegend.onAdd = () => {
      const div = L.DomUtil.create('div', 'info legend');
      div.innerHTML +=
        '<div style="text-align: center; background-color: white">' +
        '<b> Legend </b></br>' +
        '<img src="' + BlockGroupsService.SERVER_URL + '/geoserver/wms?STYLE=max_download&REQUEST=GetLegendGraphic&VERSION=1.3.0&FORMAT=image/png&LAYER=block_groups:block_groups&fontAntiAliasing:true" alt="legend">' +
        '</div>';
      return div;
    };

    const none = L.layerGroup([]);
    const hasLocal = L.layerGroup([hasLocalLayer]);
    const ooklaDownload = L.layerGroup([ooklaDownloadLayer]);
    const maxDownload = L.layerGroup([maxDownloadLayer]);

    const overlayMaps = {
      None: none,
      'Has Local ISP': hasLocal,
      'Max Download': maxDownload,
      'OOKLA Download': ooklaDownload,
    };

    L.control.layers(overlayMaps).addTo(this.map);

    this.map.on('baselayerchange', (e: LeafletEvent): void => {
      hasLocalLegend.remove();
      ooklaDownloadLegend.remove();
      maxDownloadLegend.remove();
      this.map.closePopup();
      // @ts-ignore
      if (e.name === 'Has Local ISP') {
        hasLocalLegend.addTo(this.map);
        this.currentLayer = 'Has Local ISP';
      }
      // @ts-ignore
      else if (e.name === 'OOKLA Download') {
        ooklaDownloadLegend.addTo(this.map);
        this.currentLayer = 'OOKLA Download';
      }
      // @ts-ignore
      else if (e.name === 'Max Download') {
        maxDownloadLegend.addTo(this.map);
        this.currentLayer = 'Max Download';
      }
    });

    this.map.on('click', (e: LeafletEvent) => {
      this.blockGroupsService.getFeatureInfo(
        this.map.getSize().x,
        this.map.getSize().y,
        // @ts-ignore
        Math.trunc(this.map.layerPointToContainerPoint(e.layerPoint).x),
        // @ts-ignore
        Math.trunc(this.map.layerPointToContainerPoint(e.layerPoint).y),
        this.map.getBounds()
      )
        .subscribe(featureInfo => {
            // @ts-ignore
            if (featureInfo.features.length !== 0 && this.currentLayer !== 'None') {
              // @ts-ignore
              const returnedFeature = featureInfo.features[0];
              const popup = new L.Popup({
                maxWidth: 300
              });

              popup.setContent(this.getPopup(returnedFeature));
              // @ts-ignore
              popup.setLatLng(e.latlng);
              this.map.openPopup(popup);
            }
          }
        );
    });
  }

  ngAfterViewInit(): void {
    this.initMap();
    this.initBlockGroupsLayers();
  }
}
