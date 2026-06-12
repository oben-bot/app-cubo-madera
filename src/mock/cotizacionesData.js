export const trabajosAnteriores = [
  {
    id: 1,
    nombre: "Cambio de aceite y filtro",
    descripcion: "Cambio de aceite sintético y filtro de aceite",
    precio: 1200,
    duracion: "1 hora",
    materiales: [
      { id: 3, nombre: "Aceite Motor 1L", cantidad: 1, precioUnitario: 8.99 }
    ]
  },
  {
    id: 2,
    nombre: "Alineación y balanceo",
    descripcion: "Alineación de dirección y balanceo de llantas",
    precio: 800,
    duracion: "1.5 horas",
    materiales: []
  }
];

export const cotizaciones = [
  {
    id: 1,
    cliente: "Juan Pérez",
    fecha: "2023-05-15",
    trabajo: "Cambio de aceite y filtro",
    precio: 1200,
    estado: "Autorizado",
    detalles: "Cliente aceptó el presupuesto"
  }
];