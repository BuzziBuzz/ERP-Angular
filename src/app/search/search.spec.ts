import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Search } from './search';
import { ErpStore } from '../core/erp-store';

describe('Search', () => {
  let fixture: ComponentFixture<Search>;
  let store: ErpStore;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Search],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Search);
    store = TestBed.inject(ErpStore);
    await fixture.whenStable();
  });

  it('se crea correctamente', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('el menú de módulos está cerrado hasta pulsar el botón de 3 puntos', async () => {
    const raiz = fixture.nativeElement as HTMLElement;
    expect(raiz.querySelector('.menu-modulos')).toBeNull();

    raiz.querySelector<HTMLButtonElement>('.search-menu-btn')!.click();
    await fixture.whenStable();

    expect(raiz.querySelector('.menu-modulos')).toBeTruthy();
    expect(raiz.querySelectorAll('.menu-item').length).toBeGreaterThan(4);
  });

  it('escribir en el input actualiza la búsqueda global', async () => {
    const input = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>('.search-input')!;
    input.value = 'café';
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    expect(store.busqueda()).toBe('café');
  });
});
