import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { provideHttpClient } from '@angular/common/http';
import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite';
import { defineCustomElements as jeepSqlite } from 'jeep-sqlite/loader';

import { AndroidPermissions } from '@awesome-cordova-plugins/android-permissions/ngx';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';

jeepSqlite(window);


window.addEventListener('DOMContentLoaded', async () => {
  const platform = Capacitor.getPlatform();
  const sqlite = new SQLiteConnection(CapacitorSQLite);

  try {
    if (platform === 'web') {
   
      const jeepEl = document.createElement('jeep-sqlite');
      document.body.appendChild(jeepEl);
      
      // Aguarda o elemento ser definido e inicializa o armazenamento web
      await customElements.whenDefined('jeep-sqlite');
      await sqlite.initWebStore();
    }

    
    bootstrapApplication(AppComponent, {
      providers: [
        { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
        provideIonicAngular(),
        provideRouter(routes, withPreloading(PreloadAllModules)),
        provideHttpClient(),
        AndroidPermissions, 
      ],
    });

  } catch (err) {
    console.error('Erro na inicialização do App/SQLite:', err);
  }
});