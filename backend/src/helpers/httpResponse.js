export const ok = (body) => ({
  success: true,
  statusCode: 200,
  body: body,
});

export const notFound = (message = "Not found!!!") => ({
  success: false,
  statusCode: 404,
  body: { text: message },
});

export const serverError = (error) => ({
  success: false,
  statusCode: 500,
  body: {
    text: "Internal Server Error!!!",
    error: error instanceof Error ? error.message : error, // Evita passar o objeto Error bruto que pode vir vazio no JSON.
  },
});
