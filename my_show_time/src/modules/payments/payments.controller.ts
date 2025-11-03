import { Controller, Post, Get, Param, Req, Res, Render, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { PaymentsService } from './payments.service';
import { ConcertsService } from '../concerts/concerts.service';
import { AuthGuard } from '../auth/guards/auth.guard';

@Controller('payments')
export class PaymentsController {
  constructor(
    private paymentsService: PaymentsService,
    private readonly concertsService: ConcertsService,
    private config: ConfigService,
  ) {}

  /* ============= Use example of payment */

  // ;) don't forget to import the service in the file where you want to use it and the paymentsModule in the your current module

  // @Get('/test')
  // async testPayment(@Res() res: Response) {
  //   const result = await this.paymentsService.createPaymentAndRedirect(
  //     100,
  //     'item',
  //     res,
  //   ); // <-- this is the line to add
  //   // use this card number for the test 4242424242424242
  // }

  @Get(':userId/pay/:concertId')
  @UseGuards(AuthGuard)
  async payForConcert(
    @Param('userId') userId: string,
    @Param('concertId') concertId: string,
    @Res() res: Response
  ) {
    const concert = await this.concertsService.findOne(concertId);

    return this.paymentsService.createPaymentAndRedirect(
      userId,
      concertId,
      concert.price,
      concert.name,
      res,
    );
  }

  /* ============= END - Use example of payment */

  @Get('success')
  // @Render('payments/success')
  success(@Res() res: Response) {
    return res.render('payments/success');
  }

  @Get('failure')
  // @Render('payments/failure')
  failure(@Res() res: Response) {
    return res.render('payments/failure');
  }
}