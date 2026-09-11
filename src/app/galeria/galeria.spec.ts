import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Galeria } from './galeria';
import { Producto } from '../core/models';

const PRODUCTO: Producto = {
  id: 1,
  titulo: 'Café Lungo',
  descripcion: 'Café de grano largo.',
  imagen: '',
  categoria: 'cafe',
  precio: 30,
  costo: 11,
  stock: 5,
  stockMinimo: 2,
};

describe('Galeria', () => {
  let fixture: ComponentFixture<Galeria>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Galeria] }).compileComponents();
    fixture = TestBed.createComponent(Galeria);
    fixture.componentRef.setInput('productos', [PRODUCTO]);
    await fixture.whenStable();
  });

  it('se crea correctamente', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renderiza una tarjeta por producto', () => {
    const raiz = fixture.nativeElement as HTMLElement;
    expect(raiz.querySelectorAll('.producto-card').length).toBe(1);
    expect(raiz.textContent).toContain('Café Lungo');
  });

  it('emite el producto al pulsar Agregar', async () => {
    let emitido: Producto | undefined;
    fixture.componentInstance.agregar.subscribe((p) => (emitido = p));

    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.producto-footer .btn')!.click();
    await fixture.whenStable();

    expect(emitido?.id).toBe(1);
  });

  it('deshabilita Agregar cuando no hay stock', async () => {
    fixture.componentRef.setInput('productos', [{ ...PRODUCTO, stock: 0 }]);
    await fixture.whenStable();

    const boton = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.producto-footer .btn')!;
    expect(boton.disabled).toBe(true);
  });
});
