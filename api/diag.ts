import express from 'express';

export default function mountDiagnostics(app: express.Application) {
  app.get('/api/diag', async (req, res) => {
    try {
      const url1 = process.env.DATABASE_URL_1 ? "SET" : "NOT_SET";
      res.json({
        url1
      });
    } catch(e: any) {
      res.status(500).json({ error: e.message });
    }
  });
}
