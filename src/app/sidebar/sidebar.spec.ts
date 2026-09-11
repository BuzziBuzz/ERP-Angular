import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Sidebar } from './sidebar';

describe('Sidebar', () => {
  let fixture: ComponentFixture<Sidebar>;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({ imports: [Sidebar] }).compileComponents();
    fixture = TestBed.createComponent(Sidebar);
    await fixture.whenStable();
  });

  it('se crea correctamente', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('lista "Todas" más una entrada por categoría', () => {
    const botones = (fixture.nativeElement as HTMLElement).querySelectorAll('.categoria-card');
    expect(botones.length).toBe(5);
    expect(botones[0].textContent).toContain('Todas');
  });

  it('emite la categoría elegida y la deselecciona al volver a pulsarla', async () => {
    const emitidos: string[] = [];
    fixture.componentInstance.seleccionarCategoria.subscribe((c) => emitidos.push(c));

    const botones = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('.categoria-card');
    botones[1].click();
    await fixture.whenStable();

    fixture.componentRef.setInput('seleccionada', 'refrescos');
    await fixture.whenStable();
    botones[1].click();

    expect(emitidos).toEqual(['refrescos', '']);
  });
});
