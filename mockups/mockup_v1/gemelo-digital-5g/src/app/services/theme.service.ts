import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly STORAGE_KEY = 'gd5g-theme';
  private darkMode = signal(true);

  isDark = this.darkMode.asReadonly();

  constructor() {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved === 'light') {
      this.darkMode.set(false);
      document.body.classList.add('theme-light');
    }
  }

  toggle(): void {
    const newDark = !this.darkMode();
    this.darkMode.set(newDark);

    if (newDark) {
      document.body.classList.remove('theme-light');
      localStorage.setItem(this.STORAGE_KEY, 'dark');
    } else {
      document.body.classList.add('theme-light');
      localStorage.setItem(this.STORAGE_KEY, 'light');
    }
  }
}
