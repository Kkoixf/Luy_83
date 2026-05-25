import { Component, OnInit, NgZone } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit {
  constructor(private router: Router, private ngZone: NgZone) {}

  ngOnInit(): void {
    if (Capacitor.getPlatform() === 'android') {
      App.addListener('backButton', ({ canGoBack }) => {
        this.ngZone.run(() => {
          const url = this.router.url;
          const rotasRaiz = [
            '/login',
            '/tabs/tab1',
            '/tabs/tab2',
            '/tabs/tab3',
            '/tabs/tab4'
          ];

          if (rotasRaiz.includes(url) || !canGoBack) {
            App.exitApp();
          } else {
            window.history.back();
          }
        });
      });
    }
  }
}
