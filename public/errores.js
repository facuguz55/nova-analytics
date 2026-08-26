(function () {
  var ENDPOINT = "/api/errores";

  function enviar(donde, mensaje, stack, detalle) {
    try {
      fetch(ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          app: "nova-analytics",
          asunto: (mensaje || "Error desconocido").toString().slice(0, 120),
          error: {
            id: crypto.randomUUID(),
            donde: donde,
            mensaje: mensaje ? mensaje.toString() : undefined,
            stack: stack ? stack.toString() : undefined,
            url: window.location.href,
            navegador: navigator.userAgent,
            detalle: detalle || {},
          },
        }),
      }).catch(function () {});
    } catch (e) {}
  }

  // Errores JS globales
  window.addEventListener("error", function (e) {
    enviar(
      e.filename ? e.filename.split("/").pop() : "global",
      e.message,
      e.error ? e.error.stack : undefined,
      { linea: e.lineno, columna: e.colno }
    );
  });

  // Promesas sin catch
  window.addEventListener("unhandledrejection", function (e) {
    var msg = e.reason instanceof Error ? e.reason.message : String(e.reason);
    var stack = e.reason instanceof Error ? e.reason.stack : undefined;
    enviar("unhandledrejection", msg, stack, {});
  });

  // Función global para errores manuales
  window.reportarError = function (donde, error, detalle) {
    var msg = error instanceof Error ? error.message : String(error);
    var stack = error instanceof Error ? error.stack : undefined;
    enviar(donde, msg, stack, detalle || {});
  };
})();
