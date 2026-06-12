import { Component, OnInit, NgZone } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { CommonModule } from '@angular/common'; 
import { SplashScreen } from '@capacitor/splash-screen';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  imports: [IonApp, IonRouterOutlet, CommonModule], 
})
export class AppComponent implements OnInit {
  showSplash = true; 

  constructor(private router: Router, private ngZone: NgZone) {}

  async ngOnInit(): Promise<void> {
    
    if (Capacitor.isNativePlatform()) {
      try {
        await SplashScreen.hide();
      } catch (e) {
        console.warn('Erro ao ocultar splash nativa:', e);
      }
    }

  
    setTimeout(() => {
      this.showSplash = false;
    }, 3000);

   
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