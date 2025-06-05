import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PaymentDocument = Payment & Document;

@Schema({
  timestamps: true,
  collection: 'payments',
})
export class Payment {
  @Prop({ required: true, unique: true })
  orderId: string;

  @Prop({ required: true, min: 1000 })
  amount: number;

  @Prop({ required: true })
  orderInfo: string;

  @Prop()
  bankCode: string;

  @Prop()
  userId: string;

  @Prop()
  vnpayTransactionNo: string;

  @Prop({
    enum: ['PENDING', 'SUCCESS', 'FAILED'],
    default: 'PENDING',
  })
  status: string;

  @Prop({ required: true })
  responseCode: string;

  @Prop()
  payDate: string;

  @Prop()
  bankTranNo: string;

  @Prop()
  cardType: string;

  @Prop({ type: Object })
  vnpayResponse: Record<string, any>;

  @Prop({ type: String })
  ipAddress: string;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);
