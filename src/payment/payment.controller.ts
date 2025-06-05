import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  Req,
  Res,
  ValidationPipe,
  Logger,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { PaymentService } from './payment.service';
import { VnpayService } from '../vnpay/vnpay.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { VnpayReturnDto } from './dto/vnpay-return.dto';
import { Public } from 'src/decorator/customize';

@Controller('payment')
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);

  constructor(
    private readonly paymentService: PaymentService,
    private readonly vnpayService: VnpayService,
  ) {}

  @Public()
  @Post('vnpay/create')
  async createVnpayPayment(
    @Body(ValidationPipe) createPaymentDto: CreatePaymentDto,
    @Req() req: Request,
  ) {
    try {
      // Lấy IP address
      const ipAddr =
        req.ip ||
        req.connection?.remoteAddress ||
        req.socket?.remoteAddress ||
        '127.0.0.1';

      // Tạo record payment trong database
      const payment = await this.paymentService.createPayment(
        createPaymentDto,
        ipAddr,
      );

      // Tạo URL thanh toán VNPay
      const paymentUrl = this.vnpayService.createPaymentUrl({
        amount: payment.amount,
        orderId: payment.orderId,
        orderInfo:
          payment.orderInfo || `Thanh toan don hang ${payment.orderId}`,
        ipAddress: ipAddr,
        bankCode: createPaymentDto.bankCode,
      });

      return {
        success: true,
        data: {
          paymentUrl,
          orderId: payment.orderId,
          amount: payment.amount,
        },
      };
    } catch (error) {
      this.logger.error('Error creating VNPay payment:', error);
      return {
        success: false,
        message: error.message || 'Có lỗi xảy ra khi tạo thanh toán',
      };
    }
  }

  @Get('vnpay-return')
  async vnpayReturn(@Query() query: VnpayReturnDto, @Res() res: Response) {
    try {
      this.logger.log(`VNPay return callback: ${JSON.stringify(query)}`);

      // Verify checksum
      const isValid = this.vnpayService.verifyReturn(query);
      if (!isValid) {
        this.logger.error(`Invalid checksum for order: ${query.vnp_TxnRef}`);
        return res.redirect(
          `/payment/result?success=false&message=Checksum không hợp lệ`,
        );
      }

      // Update payment status in database
      await this.paymentService.updatePaymentStatus(query.vnp_TxnRef, query);

      // Redirect based on payment result
      if (query.vnp_ResponseCode === '00') {
        // Payment successful
        return res.redirect(
          `/payment/result?success=true&orderId=${query.vnp_TxnRef}&amount=${query.vnp_Amount}&transactionNo=${query.vnp_TransactionNo}`,
        );
      } else {
        // Payment failed
        const message = this.vnpayService.getResponseMessage(
          query.vnp_ResponseCode,
        );
        return res.redirect(
          `/payment/result?success=false&orderId=${query.vnp_TxnRef}&message=${encodeURIComponent(message)}`,
        );
      }
    } catch (error) {
      this.logger.error('VNPay return callback error:', error);
      return res.redirect(
        `/payment/result?success=false&message=${encodeURIComponent('Có lỗi xảy ra khi xử lý thanh toán')}`,
      );
    }
  }

  @Get('status/:orderId')
  async getPaymentStatus(@Param('orderId') orderId: string) {
    try {
      const payment = await this.paymentService.findByOrderId(orderId);
      return {
        success: true,
        data: payment,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @Get('history')
  async getPaymentHistory(
    @Query('userId') userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    try {
      if (!userId) {
        return {
          success: false,
          message: 'userId is required',
        };
      }

      const result = await this.paymentService.findByUserId(
        userId,
        page,
        limit,
      );
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @Get('stats')
  async getPaymentStats(@Query('userId') userId?: string) {
    try {
      const stats = await this.paymentService.getPaymentStats(userId);
      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}
