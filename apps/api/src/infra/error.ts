import { AxiosError } from "axios";
import { Response } from "express";

export class HttpError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "HttpError";
    Error.captureStackTrace(this, this.constructor);
  }
}

export const logError = (err: unknown, title?: string) => {
  if (title) console.error(`❌ ${title}`);
  if (err instanceof Error) {
    console.error(err.message, err.stack);
  } else {
    console.error(`Erro!`, err);
  }
};

export const resError = (error: unknown, res: Response) => {
  if (error instanceof HttpError) {
    res.status(error.status).json({ message: error.message });
  } else if (typeof error === "string") {
    res.status(500).json({ message: error });
  } else if (error instanceof AxiosError) {
    res.status(error.response?.status || 500).json({ message: error.message });
  } else if (error instanceof Error) {
    res
      .status(500)
      .json({ message: error.message || "Erro interno no servidor" });
  } else {
    res.status(500).json({ message: "Erro interno no servidor" });
  }
};
