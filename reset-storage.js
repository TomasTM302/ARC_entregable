// Este script se puede ejecutar en la consola del navegador para resetear el almacenamiento local
// y forzar una recarga completa de los datos de autenticación

// Eliminar el almacenamiento local de autenticación
localStorage.removeItem("arcos-auth-storage")

// Opcional: Mostrar un mensaje de confirmación
console.log("Almacenamiento de autenticación eliminado. Por favor, recarga la página.")

// Opcional: Recargar la página automáticamente
// window.location.reload();
