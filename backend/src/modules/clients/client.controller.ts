import type { Request, RequestHandler, Response } from "express";
import { asyncHandler } from "../../middlewares/async-handler.js";
import { attachmentDisposition } from "../../shared/utils/http.js";
import { clientQuerySchema, createClientDocumentSchema } from "./client.schemas.js";
import * as service from "./client.service.js";

function requestMeta(req: Request) {
  return { ipAddress: req.ip, userAgent: req.get("user-agent") };
}

export const listClients: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await service.listClients(clientQuerySchema.parse(req.query), req.auth!) });
});

export const createClient: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  res.status(201).json({ data: await service.createClient(req.body, req.auth!, requestMeta(req)) });
});

export const getClient: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await service.getClient(String(req.params.id), req.auth!) });
});

export const getClientSummary: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await service.getClientSummary(String(req.params.id), req.auth!) });
});

export const updateClient: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await service.updateClient(String(req.params.id), req.body, req.auth!, requestMeta(req)) });
});

export const deleteClient: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await service.softDeleteClient(String(req.params.id), req.auth!, requestMeta(req)) });
});

export const listDocuments: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await service.listDocuments(String(req.params.id), req.auth!) });
});

export const addDocument: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const input = createClientDocumentSchema.parse(req.body);
  res.status(201).json({ data: await service.addDocument(String(req.params.id), input, req.file, req.auth!, requestMeta(req)) });
});

export const downloadDocument: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const { document, stream } = await service.getDocumentDownload(String(req.params.documentId), req.auth!, requestMeta(req));
  res.setHeader("Content-Type", document.mimeType);
  res.setHeader("Content-Disposition", attachmentDisposition(document.fileName, "client-document"));
  stream.pipe(res);
});

export const deleteDocument: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await service.deleteDocument(String(req.params.documentId), req.auth!, requestMeta(req)) });
});

export const riskCheck: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await service.riskCheck(String(req.query.identity ?? ""), req.auth!, requestMeta(req)) });
});
