import { UsersService } from './modules/users/users.service';
import { ConcertsService } from './modules/concerts/concerts.service';
import { Controller, Get, Param, Query, Render, Req, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { FilterConcertDto } from './modules/concerts/dto/filter-concert.dto';
import { PaymentsService } from './modules/payments/payments.service';
import type { Request, Response } from 'express';
import { UserResponseDto } from './modules/users/dto/user-response.dto';


@Controller()
export class AppController {
  constructor(private readonly appService: AppService,private readonly usersService: UsersService, private readonly concertsService: ConcertsService, private readonly paymentsService: PaymentsService) {}


  @Get('/')

  async userConnect(@Query() limit, @Req() req: Request,@Res() res: Response) {
    const concertsResult = await this.concertsService.findAll(limit);
    return res.render('home',{concerts: concertsResult.data})

}


  
  @Get('wishlist')
  @Render('site/wishlist')
  async wishlist() {
    // const concerts = await this.concertsService.findAll();
    return { 
      title: 'Concert Booking',
    };
  }  



  /* ============= Use example of payment */
  // ;) don't forget to import the service in the file where you want to use it and the paymentsModule in the your current module

  // @Get('/test')
  // async testPayment(@Res() res: Response) {
  //   const result = await this.paymentsService.createPaymentAndRedirect(100, 'item', res); // <-- this is the line to add
  //   // use this card number for the test 4242424242424242
  // }
}
