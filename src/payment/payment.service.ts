import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Payment, PaymentDocument } from './schemas/payment.schema';
import { CreatePaymentDto } from './dto/create-payment.dto';
import moment from 'moment';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
  ) {}

  async createPayment(
    createPaymentDto: CreatePaymentDto,
    ipAddress: string,
  ): Promise<Payment> {
    const orderId = createPaymentDto.orderId || this.generateOrderId();

    // Kiểm tra duplicate orderId
    const existingPayment = await this.paymentModel.findOne({ orderId });
    if (existingPayment) {
      throw new ConflictException(
        `Payment with orderId ${orderId} already exists`,
      );
    }

    const payment = new this.paymentModel({
      ...createPaymentDto,
      orderId,
      status: 'PENDING',
      responseCode: '99', // Default pending code
      ipAddress,
    });

    const savedPayment = await payment.save();
    this.logger.log(`Created payment record: ${orderId}`);

    return savedPayment;
  }

  async updatePaymentStatus(
    orderId: string,
    vnpayResponse: any,
  ): Promise<Payment> {
    const payment = await this.paymentModel.findOne({ orderId });

    if (!payment) {
      throw new NotFoundException(`Payment with orderId ${orderId} not found`);
    }

    // Prevent duplicate processing
    if (payment.status !== 'PENDING') {
      this.logger.warn(
        `Payment ${orderId} already processed with status: ${payment.status}`,
      );
      return payment;
    }

    const updateData = {
      status: vnpayResponse.vnp_ResponseCode === '00' ? 'SUCCESS' : 'FAILED',
      responseCode: vnpayResponse.vnp_ResponseCode,
      vnpayTransactionNo: vnpayResponse.vnp_TransactionNo,
      payDate: vnpayResponse.vnp_PayDate,
      bankTranNo: vnpayResponse.vnp_BankTranNo,
      cardType: vnpayResponse.vnp_CardType,
      vnpayResponse: vnpayResponse,
      updatedAt: new Date(),
    };

    const updatedPayment = await this.paymentModel.findOneAndUpdate(
      { orderId },
      updateData,
      { new: true },
    );

    this.logger.log(
      `Updated payment status: ${orderId} - ${updateData.status}`,
    );
    return updatedPayment;
  }

  async findByOrderId(orderId: string): Promise<Payment> {
    const payment = await this.paymentModel.findOne({ orderId });

    if (!payment) {
      throw new NotFoundException(`Payment with orderId ${orderId} not found`);
    }

    return payment;
  }

  async findByUserId(
    userId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    payments: Payment[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      this.paymentModel
        .find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.paymentModel.countDocuments({ userId }),
    ]);

    return {
      payments,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getPaymentStats(userId?: string): Promise<{
    totalPayments: number;
    successfulPayments: number;
    failedPayments: number;
    pendingPayments: number;
    totalAmount: number;
  }> {
    const matchStage = userId ? { userId } : {};

    const stats = await this.paymentModel.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalPayments: { $sum: 1 },
          successfulPayments: {
            $sum: { $cond: [{ $eq: ['$status', 'SUCCESS'] }, 1, 0] },
          },
          failedPayments: {
            $sum: { $cond: [{ $eq: ['$status', 'FAILED'] }, 1, 0] },
          },
          pendingPayments: {
            $sum: { $cond: [{ $eq: ['$status', 'PENDING'] }, 1, 0] },
          },
          totalAmount: {
            $sum: { $cond: [{ $eq: ['$status', 'SUCCESS'] }, '$amount', 0] },
          },
        },
      },
    ]);

    return (
      stats[0] || {
        totalPayments: 0,
        successfulPayments: 0,
        failedPayments: 0,
        pendingPayments: 0,
        totalAmount: 0,
      }
    );
  }

  private generateOrderId(): string {
    return (
      moment().format('DDHHmmss') +
      Math.random().toString(36).substr(2, 4).toUpperCase()
    );
  }
}
