import { Producto } from '../core/models';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';



export const PRODUCTOS: Producto[] = [
  {
    id: 1,
    titulo: 'Coca-Cola 600 ml',
    descripcion: 'Refresco de cola, botella individual.',
    imagen: 'assets/imagenes/coke.png',
    categoria: 'refrescos',
    precio: 25,
    costo: 14,
    stock: 48,
    stockMinimo: 12,
  },
  {
    id: 2,
    titulo: 'Pepsi 600 ml',
    descripcion: 'Refresco de cola, botella individual.',
    imagen: 'assets/imagenes/pepi.png',
    categoria: 'refrescos',
    precio: 22,
    costo: 12,
    stock: 30,
    stockMinimo: 12,
  },
  {
    id: 3,
    titulo: 'Café Lungo',
    descripcion: 'Café de grano largo, 250 ml.',
    imagen: 'assets/imagenes/cafe.png',
    categoria: 'cafe',
    precio: 30,
    costo: 11,
    stock: 60,
    stockMinimo: 15,
  },
  {
    id: 4,
    titulo: 'Capuchino',
    descripcion: 'Espresso con leche vaporizada y espuma.',
    imagen: '',
    categoria: 'cafe',
    precio: 42,
    costo: 16,
    stock: 40,
    stockMinimo: 10,
  },
  {
    id: 5,
    titulo: 'Frappé de Moka',
    descripcion: 'Bebida fría de café con chocolate y crema.',
    imagen: '',
    categoria: 'frappes',
    precio: 65,
    costo: 24,
    stock: 18,
    stockMinimo: 8,
  },
  {
    id: 6,
    titulo: 'Smoothie de Fresa',
    descripcion: 'Fresa natural, yogurt y hielo.',
    imagen: '',
    categoria: 'frappes',
    precio: 58,
    costo: 21,
    stock: 6,
    stockMinimo: 8,
  },
  {
    id: 7,
    titulo: 'Croissant',
    descripcion: 'Hojaldre de mantequilla horneado del día.',
    imagen: '',
    categoria: 'alimentos',
    precio: 38,
    costo: 15,
    stock: 22,
    stockMinimo: 10,
  },
  {
    id: 8,
    titulo: 'Sándwich de Jamón',
    descripcion: 'Pan artesanal, jamón de pavo y queso.',
    imagen: '',
    categoria: 'alimentos',
    precio: 65,
    costo: 28,
    stock: 4,
    stockMinimo: 6,
  },
  {
    id: 9,
    titulo: 'Ensalada César',
    descripcion: 'Lechuga, pollo, crutones y aderezo César.',
    imagen: '',
    categoria: 'alimentos',
    precio: 75,
    costo: 32,
    stock: 12,
    stockMinimo: 8,
  }
];
/*
se crea un servicio para manejar los productos, permitiendo actualizar la lista de productos y mantenerla sincronizada
 con el almacenamiento local (localStorage). 
 Esto facilita la gestión de los productos en la aplicación y asegura que los cambios 
 se reflejen en todas las partes de la aplicación que consumen esta información.
*/
@Injectable({
  providedIn: 'root'
})
export class ProductosService {
  private readonly STORAGE_KEY = 'productos';
  private productosSubject: BehaviorSubject<Producto[]>;

  constructor() {
    const productosGuardados = localStorage.getItem(this.STORAGE_KEY);
    const productosIniciales = productosGuardados ? JSON.parse(productosGuardados) : PRODUCTOS;
    this.productosSubject = new BehaviorSubject<Producto[]>(productosIniciales);
  }
  actualizarProductos(productos: Producto[]): void {
    this.productosSubject.next(productos);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(productos));
  }
}