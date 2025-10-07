export async function defaultHandler(message: string) {
  return Response.json({
    intent: "desconocido",
    response: "Perdona, no he entendido bien tu mensaje 🤔. ¿Podrías reformularlo?",
  });
}
