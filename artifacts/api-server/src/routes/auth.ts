import { GetCurrentAuthUserResponse } from '@workspace/api-zod';
import { Router, type IRouter, type Request, type Response } from 'express';

import {
  clearSession,
  createSession,
  getSessionId,
  SESSION_COOKIE,
  SESSION_TTL,
} from '../lib/auth';

const router: IRouter = Router();

function setSessionCookie(res: Response, sid: string) {
  res.cookie(SESSION_COOKIE, sid, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL,
  });
}

router.get('/auth/user', (req: Request, res: Response) => {
  res.json(
    GetCurrentAuthUserResponse.parse({
      user: req.isAuthenticated() ? req.user : null,
    }),
  );
});

router.post('/auth/login', async (req: Request, res: Response) => {
  const { email, password } = req.body as { email?: string; password?: string };
  const validEmail = process.env.LOGIN_EMAIL;
  const validPassword = process.env.LOGIN_PASSWORD;

  if (!validEmail || !validPassword) {
    res.status(500).json({ error: 'Credenciais não configuradas no servidor.' });
    return;
  }

  if (!email || !password || email !== validEmail || password !== validPassword) {
    res.status(401).json({ error: 'E-mail ou senha inválidos.' });
    return;
  }

  const sid = await createSession({
    user: {
      id: 'owner',
      email: validEmail,
      firstName: 'Thiago',
      lastName: null,
      profileImageUrl: null,
    },
  });

  setSessionCookie(res, sid);
  res.json({ ok: true });
});

router.get('/logout', async (req: Request, res: Response) => {
  const sid = getSessionId(req);
  await clearSession(res, sid);
  res.redirect('/');
});

export default router;
