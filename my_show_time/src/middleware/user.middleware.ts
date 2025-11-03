import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class UserMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const userCookie = req.cookies?.currentUser;
    
    let user = null;
    if (userCookie) {
      try {
        const userData = JSON.parse(userCookie);
        user = userData.user || userData; 
      } catch (error) {
        console.error('Error parsing user cookie:', error);
      }
    }
    res.locals.user = user;
    
    next();
  }
}