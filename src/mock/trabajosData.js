export const trabajosPendientes = [
  {
    id: 1,
    cliente: "Juan Pérez",
    trabajo: "Cambio de aceite y filtro",
    descripcion: "Cambio de aceite sintético y filtro de aceite",
    prioridad: "Alta",
    fechaEntrada: "2023-06-01",
    fechaEstimada: "2023-06-03",
    materiales: [
      { id: 3, nombre: "Aceite Motor 1L", cantidad: 1 }
    ],
    precio: 1200,
    estado: "En progreso",
    tecnico: "Carlos López"
  },
  {
    id: 2,
    cliente: "María García",
    trabajo: "Alineación y balanceo",
    descripcion: "Alineación de dirección y balanceo de llantas",
    prioridad: "Media",
    fechaEntrada: "2023-06-02",
    fechaEstimada: "2023-06-05",
    materiales: [],
    precio: 800,
    estado: "Pendiente",
    tecnico: ""
  }
];

export const historialTrabajos = [
  {
    id: 101,
    cliente: "Roberto Sánchez",
    trabajo: "Reparación de transmisión",
    fechaInicio: "2023-05-10",
    fechaFin: "2023-05-15",
    precio: 3500,
    estado: "Concluido",
    tecnico: "Carlos López",
    costoMateriales: 1200,
    ganancia: 2300
  }
];